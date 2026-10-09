"""
Cloudinary storage backend for user uploads (prescriptions + medicine images).

Why this file exists
--------------------
Render's free tier cannot mount a persistent disk, and its filesystem is wiped
on every deploy, so uploads cannot live on local disk in production.

``django-cloudinary-storage`` - the package everyone reaches for - is
deliberately NOT used here. It has not released since 2020, its classifiers
stop at Python 3.8, and it is configured through ``DEFAULT_FILE_STORAGE``,
which Django 5.1 removed. This module instead implements the Django Storage
API directly against Cloudinary's official SDK, which is actively maintained.

Resource type
-------------
Cloudinary stores assets as one of ``image``, ``video`` or ``raw``. The choice
matters: a PDF stored as ``image`` will not deliver correctly, and a JPEG
stored as ``raw`` cannot be transformed. The type is derived from the file
extension so ``url()`` never needs a network round-trip.
"""
import os

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from cloudinary.exceptions import NotFound

from django.conf import settings
from django.core.files.base import File
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible
from django.utils.functional import cached_property

# Cloudinary's own classification of uploadable extensions.
IMAGE_EXTENSIONS = {
    "jpg", "jpe", "jpeg", "jpc", "jp2", "j2k", "wdp", "jxr", "hdp",
    "png", "gif", "webp", "bmp", "tif", "tiff", "ico", "heic", "avif",
}
VIDEO_EXTENSIONS = {
    "mp4", "webm", "flv", "mov", "ogv", "3gp", "3g2", "wmv", "mpeg", "avi",
}


@deconstructible
class CloudinaryMediaStorage(Storage):
    """Stores uploads on Cloudinary and serves them from its CDN."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        cloudinary.config(
            cloud_name=getattr(settings, "CLOUDINARY_CLOUD_NAME", None),
            api_key=getattr(settings, "CLOUDINARY_API_KEY", None),
            api_secret=getattr(settings, "CLOUDINARY_API_SECRET", None),
            secure=True,
        )

    # -- helpers ---------------------------------------------------------

    @staticmethod
    def _resource_type(name):
        """Map a filename to a Cloudinary resource type."""
        ext = os.path.splitext(name)[1].lstrip(".").lower()
        if ext in IMAGE_EXTENSIONS:
            return "image"
        if ext in VIDEO_EXTENSIONS:
            return "video"
        # Everything else - PDFs, scans without an extension - must be raw,
        # otherwise Cloudinary refuses the upload.
        return "raw"

    def _split(self, name):
        """Return (public_id, resource_type) for a stored name."""
        public_id = os.path.splitext(name)[0].replace(os.sep, "/")
        return public_id, self._resource_type(name)

    # -- Storage API -----------------------------------------------------

    def _open(self, name, mode="rb"):
        # Cloudinary has no "open a file object" API, so pull the delivered
        # bytes over HTTP. This is only hit for re-reading an upload.
        import urllib.request

        with urllib.request.urlopen(self.url(name)) as response:
            return File(response.read(), name=name)

    def _save(self, name, content):
        """
        Upload and return the name Django should persist on the row.

        ``unique_filename=True`` delegates collision handling to Cloudinary,
        which appends a random suffix and guarantees we never overwrite an
        existing patient prescription. ``exists()`` therefore returns False and
        Django's own suffix loop is skipped, saving a network round-trip.
        """
        if hasattr(content, "seek"):
            content.seek(0)

        folder, filename = os.path.split(name)
        public_id = os.path.splitext(filename)[0]
        resource_type = self._resource_type(name)

        result = cloudinary.uploader.upload(
            content,
            folder=folder.replace(os.sep, "/") or None,
            public_id=public_id,
            resource_type=resource_type,
            unique_filename=True,
            overwrite=False,
        )

        # Cloudinary returns the final, possibly de-duplicated public id
        # (e.g. "prescriptions/prescription_2_ab12cd"). Re-attach the
        # extension so the stored name matches what url() expects.
        extension = os.path.splitext(filename)[1]
        return result["public_id"] + extension

    def delete(self, name):
        public_id, resource_type = self._split(name)
        try:
            cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except NotFound:
            # Already gone - Django treats delete as idempotent.
            pass

    def exists(self, name):
        """
        Always False, on purpose.

        Cloudinary assigns a unique public id on upload (see _save), so there
        is nothing to collide with, and returning False avoids the API lookup
        Django's get_available_name() would otherwise trigger on every upload.
        """
        return False

    def url(self, name):
        public_id, resource_type = self._split(name)
        url, _options = cloudinary.utils.cloudinary_url(
            public_id,
            resource_type=resource_type,
            secure=True,
        )
        return url

    def size(self, name):
        public_id, resource_type = self._split(name)
        return cloudinary.api.resource(public_id, resource_type=resource_type)["bytes"]

    def get_accessed_time(self, name):
        from django.utils import timezone

        public_id, resource_type = self._split(name)
        info = cloudinary.api.resource(public_id, resource_type=resource_type)
        return timezone.make_aware(
            __import__("datetime").datetime.fromtimestamp(info["last_updated"])
        )

    def get_created_time(self, name):
        from django.utils import timezone

        public_id, resource_type = self._split(name)
        info = cloudinary.api.resource(public_id, resource_type=resource_type)
        return timezone.make_aware(
            __import__("datetime").datetime.fromtimestamp(info["created_at"])
        )
