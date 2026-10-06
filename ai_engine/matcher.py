from rapidfuzz import fuzz

from medicine.models import Medicine

from .utils import normalize_medicine_name, normalize_strength


# =========================================
# MATCH THRESHOLDS
# =========================================

POSSIBLE_THRESHOLD = 75


# =========================================
# STRENGTH COMPATIBILITY
# =========================================

def strengths_compatible(prescription_strength, database_strength):

    # No strength on the prescription -> cannot rule it out.

    if not prescription_strength:
        return True


    database_normalized = normalize_strength(database_strength)


    # DB row has no strength recorded -> treat as unknown,
    # not as a mismatch.

    if not database_normalized:
        return True


    return (
        normalize_strength(prescription_strength)
        == database_normalized
    )


# =========================================
# FORMAT MEDICINE
# =========================================

def format_medicine(medicine, score=None):

    data = {
        "id": str(medicine.id),
        "brand_name": medicine.brand_name,
        "generic_name": medicine.generic_name,
        "strength": medicine.strength,
        "manufacturer": medicine.manufacturer,
        "requires_prescription": medicine.requires_prescription,
    }

    if score is not None:
        data["score"] = round(score, 2)

    return data


# =========================================
# MATCH ONE MEDICINE
# =========================================

def match_one_medicine(medicine_data):

    written_name = medicine_data.get(
        "written_name",
        ""
    )

    medicine_name = medicine_data.get(
        "medicine_name",
        ""
    )

    dosage_form = medicine_data.get(
        "dosage_form"
    )

    prescription_strength = medicine_data.get(
        "strength"
    )

    confidence = medicine_data.get(
        "confidence",
        "low"
    )


    # =========================================
    # USE CLEAN MEDICINE NAME
    # =========================================

    search_name = (
        medicine_name
        or written_name
    )

    normalized_name = normalize_medicine_name(
        search_name
    )


    # =========================================
    # UNCLEAR
    # =========================================

    if not normalized_name:

        return {
            "written_name": written_name,
            "medicine_name": medicine_name,
            "dosage_form": dosage_form,
            "strength": prescription_strength,
            "confidence": confidence,
            "status": "unclear",
            "matched_medicine": None,
            "possible_matches": [],
        }


    # =========================================
    # DATABASE
    # =========================================

    medicines = Medicine.objects.filter(is_active=True)

    exact_matches = []

    possible_matches = []


    # =========================================
    # SEARCH
    # =========================================

    for medicine in medicines:

        brand_name = normalize_medicine_name(
            medicine.brand_name
        )

        generic_name = normalize_medicine_name(
            medicine.generic_name
        )


        # =====================================
        # EXACT BRAND / GENERIC MATCH
        # =====================================

        exact_name_match = (
            normalized_name == brand_name
            or normalized_name == generic_name
        )


        if exact_name_match:

            # If prescription strength is known, verify it against
            # the database strength.

            # NOTE: a mismatch deliberately does NOT `continue` —
            # that used to skip the fuzzy scoring below as well and
            # drop the row from both lists, reporting a medicine
            # that IS in the catalog as "not available". Falling
            # through lets it surface as a possible_match instead.

            if strengths_compatible(
                prescription_strength,
                medicine.strength,
            ):

                exact_matches.append(
                    medicine
                )

                continue


        # =====================================
        # FUZZY BRAND MATCH
        # =====================================

        brand_score = fuzz.ratio(
            normalized_name,
            brand_name
        )


        # =====================================
        # FUZZY GENERIC MATCH
        # =====================================

        generic_score = fuzz.ratio(
            normalized_name,
            generic_name
        )


        best_score = max(
            brand_score,
            generic_score
        )


        if best_score >= POSSIBLE_THRESHOLD:

            possible_matches.append({
                "medicine": medicine,
                "score": best_score,
            })


    # =========================================
    # ONE EXACT MATCH
    # =========================================

    if len(exact_matches) == 1:

        medicine = exact_matches[0]

        return {
            "written_name": written_name,
            "medicine_name": medicine_name,
            "dosage_form": dosage_form,
            "strength": prescription_strength,
            "confidence": confidence,
            "status": "matched",
            "matched_medicine": format_medicine(
                medicine
            ),
            "possible_matches": [],
        }


    # =========================================
    # MULTIPLE EXACT MATCHES
    # =========================================

    if len(exact_matches) > 1:

        duplicate_matches = []

        for medicine in exact_matches:

            duplicate_matches.append(
                format_medicine(
                    medicine,
                    100
                )
            )


        return {
            "written_name": written_name,
            "medicine_name": medicine_name,
            "dosage_form": dosage_form,
            "strength": prescription_strength,
            "confidence": confidence,
            "status": "multiple_matches",
            "matched_medicine": None,
            "possible_matches": duplicate_matches,
        }


    # =========================================
    # SORT POSSIBLE MATCHES
    # =========================================

    possible_matches.sort(
        key=lambda item: item["score"],
        reverse=True
    )


    possible_matches = possible_matches[:5]


    # =========================================
    # FORMAT POSSIBLE MATCHES
    # =========================================

    formatted_matches = []

    for item in possible_matches:

        formatted_matches.append(
            format_medicine(
                item["medicine"],
                item["score"]
            )
        )


    # =========================================
    # POSSIBLE MATCH
    # =========================================

    if formatted_matches:

        return {
            "written_name": written_name,
            "medicine_name": medicine_name,
            "dosage_form": dosage_form,
            "strength": prescription_strength,
            "confidence": confidence,
            "status": "possible_match",
            "matched_medicine": None,
            "possible_matches": formatted_matches,
        }


    # =========================================
    # NOT AVAILABLE
    # =========================================

    return {
        "written_name": written_name,
        "medicine_name": medicine_name,
        "dosage_form": dosage_form,
        "strength": prescription_strength,
        "confidence": confidence,
        "status": "not_available",
        "matched_medicine": None,
        "possible_matches": [],
    }


# =========================================
# MATCH ALL MEDICINES
# =========================================

def match_medicines(medicines):

    results = []

    for medicine in medicines:

        result = match_one_medicine(
            medicine
        )

        results.append(
            result
        )

    return results