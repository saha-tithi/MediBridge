from rapidfuzz import fuzz

from medicine.models import Medicine


def match_medicines(text, threshold=80):

    matches = []

    medicines = Medicine.objects.all()

    for medicine in medicines:

        score_brand = fuzz.partial_ratio(
            medicine.brand_name.upper(),text,)

        score_generic = fuzz.partial_ratio(medicine.generic_name.upper(),text,)

        score = max(score_brand, score_generic)

        if score >= threshold:
            matches.append(
                {
                    "medicine_id": str(medicine.id),
                    "brand_name": medicine.brand_name,
                    "generic_name": medicine.generic_name,
                    "strength": medicine.strength,
                    "confidence": score,
                }
            )

    matches.sort(key=lambda item: item["confidence"],reverse=True,)

    return matches