import os

from django.db import migrations


# The one medicine image that survived, on Cloudinary as
# medicines/Amoxicillin_jawtcx.webp.
#
# Cloudinary de-duplicates on upload: the *_save_ backend passes
# unique_filename=True, so storing Amoxicillin a second time produced this
# suffixed public id rather than overwriting the first. The row that was
# copied over from the local database still pointed at the original name,
# which no longer resolves.
RECOVERED = {
    "Amoxicillin": "medicines/Amoxicillin_jawtcx.webp",
}


def repair_image_references(apps, schema_editor):
    """Make every medicine image point at a file that actually exists.

    Four medicines carried an image filename into production, and all four
    point at nothing. The rows were copied from the local database, where
    the files had already been lost: media/ is gitignored and has never
    been committed, and Render's free tier has no persistent disk that
    could have kept them. The storefront answered by rendering four
    broken-image icons.

    Only one of the four assets survived, on Cloudinary, and only under a
    different name. The other three exist nowhere - git history, local
    disk and Cloudinary have all been checked - so their references are
    dropped and medicine_list.js draws its pill placeholder instead.

    Matching is on the stored filename rather than on the medicine, so
    this is unaffected by renaming and does nothing on a second run.
    """
    Medicine = apps.get_model("medicine", "Medicine")

    dangling = Medicine.objects.filter(image__isnull=False).exclude(image="")

    for medicine in dangling:
        stored = medicine.image.name

        if not stored.startswith("medicines/"):
            continue

        stem = os.path.splitext(os.path.basename(stored))[0]
        replacement = RECOVERED.get(stem)

        if replacement == stored:
            continue

        # An empty string clears the field, which the serializer already
        # returns as null for the medicines that never had an image.
        medicine.image = replacement or ""
        medicine.save(update_fields=["image"])


class Migration(migrations.Migration):

    dependencies = [
        ("medicine", "0002_medicine_is_active"),
    ]

    operations = [
        migrations.RunPython(
            repair_image_references,
            # Forward-only. There is no dangling reference worth restoring
            # on the way back, and rebuilding the database replays this
            # migration from scratch anyway.
            migrations.RunPython.noop,
        ),
    ]
