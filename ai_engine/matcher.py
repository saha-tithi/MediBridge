from datetime import date

from rapidfuzz import fuzz

from medicine.models import Medicine


def get_medicine_availability(medicine):

    inventories = medicine.inventories.filter(
        is_available=True,
        stock__gt=0,
        expiry_date__gte=date.today(),
    )

    if inventories.exists():
        return "AVAILABLE"

    return "OUT_OF_STOCK"


def match_medicines(text, threshold=80):

    matches = []

    if not text:
        return matches

    text = text.upper()

    medicines = Medicine.objects.all()

    for medicine in medicines:

        score_brand = fuzz.partial_ratio(
            medicine.brand_name.upper(),
            text,
        )

        score_generic = fuzz.partial_ratio(
            medicine.generic_name.upper(),
            text,
        )

        score = max(
            score_brand,
            score_generic,
        )

        if score >= threshold:

            availability = (
                get_medicine_availability(
                    medicine
                )
            )

            matches.append(
                {
                    "medicine_id": str(
                        medicine.id
                    ),

                    "brand_name":
                        medicine.brand_name,

                    "generic_name":
                        medicine.generic_name,

                    "strength":
                        medicine.strength,

                    "confidence":
                        score,

                    "availability":
                        availability,
                }
            )

    matches.sort(
        key=lambda item:
            item["confidence"],
        reverse=True,
    )

    return matches