from .gemini import read_medicines_from_image
from .matcher import match_medicines


# =========================================
# PROCESS PRESCRIPTION
# =========================================

def process_prescription(
    prescription
):

    # =========================================
    # GET FILE
    # =========================================

    file_path = prescription.prescription.path


    # =========================================
    # GEMINI
    # =========================================

    gemini_result = read_medicines_from_image(
        file_path
    )


    # =========================================
    # EXTRACT MEDICINES
    # =========================================

    medicines_from_gemini = (
        gemini_result.get(
            "medicines",
            []
        )
    )


    # =========================================
    # MATCH DATABASE
    # =========================================

    matched_results = match_medicines(
        medicines_from_gemini
    )


    # =========================================
    # SAVE RAW AI RESULT
    # =========================================
    prescription.extracted_text = (
    "\n".join(
        medicine.get("written_name", "")
        for medicine in medicines_from_gemini
        if medicine.get("written_name")
    )
)
   


    # =========================================
    # SAVE MATCHED RESULT
    # =========================================

    prescription.extracted_medicines = (
        matched_results
    )


    prescription.save(
        update_fields=[
            "extracted_text",
            "extracted_medicines",
        ]
    )


    # =========================================
    # RETURN
    # =========================================

    return {
        "extracted_text": (
            prescription.extracted_text
        ),

        "medicines": matched_results,
    }