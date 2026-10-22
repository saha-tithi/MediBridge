import os

from django.db import migrations


# Amoxil's image did survive, on Cloudinary as
# medicines/Amoxicillin_jawtcx.webp.
#
# Cloudinary de-duplicates on upload: the storage backend passes
# unique_filename=True with overwrite=False, so storing Amoxicillin a
# second time produced this suffixed public id instead of overwriting
# the first. The row copied over from the local database still pointed
# at the original name, which no longer resolves.
RECOVERED = {
    "Amoxicillin": "medicines/Amoxicillin_jawtcx.webp",
}

# The other three filenames that came across from the local database and
# resolve to nothing anywhere: git history holds no media at all, the
# local media/medicines directory does not exist, and Cloudinary has
# never held them. Matched without the extension, because the two
# databases do not agree on what those extensions were.
LOST = {
    "Benadryl",
    "WhatsApp_Image_2026-09-06_at_8.37.26_PM",
    "image1",
}


def repair_image_references(apps, schema_editor):
    """Repoint the medicine image that survived and drop the three that did not.

    Four medicines carried an image filename into production. The rows
    were copied from the local database, where the files had already
    been lost before deployment: media/ is gitignored and has never been
    committed, and Render's free tier has no persistent disk that could
    have kept them. The storefront answered by rendering four
    broken-image icons.

    This names the affected files rather than clearing anything the
    backend cannot confirm. It makes no network calls - a migration
    should not fail because Cloudinary is unreachable - so it cannot
    tell a lost file from a live one by asking, and guessing would mean
    deleting an image someone had since uploaded correctly. An explicit
    list costs nothing and cannot surprise anybody.

    Matching is on the filename without its extension, and the medicine
    itself is never named, so renaming does not break it.
    """
    Medicine = apps.get_model("medicine", "Medicine")

    for medicine in Medicine.objects.filter(image__isnull=False).exclude(image=""):
        stored = medicine.image.name

        if not stored.startswith("medicines/"):
            continue

        stem = os.path.splitext(os.path.basename(stored))[0]

        if stem in RECOVERED:
            replacement = RECOVERED[stem]
        elif stem in LOST:
            replacement = ""
        else:
            # Not one of ours - leave it alone.
            continue

        if replacement == stored:
            continue

        # An empty string clears the field, which the serializer already
        # returns as null for the medicines that never had an image.
        medicine.image = replacement
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
