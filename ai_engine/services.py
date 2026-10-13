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

    # Read through the storage API, never via .path. FieldFile.path asks
    # storage for a local filesystem path, which only FileSystemStorage can
    # supply: in production the upload lives on Cloudinary and the inherited
    # Storage.path() raises NotImplementedError("This backend doesn't
    # support absolute paths"). open().read() works under both - locally it
    # reads the disk, in production CloudinaryMediaStorage._open() pulls the
    # bytes down from the CDN.
    prescription.prescription.open("rb")
    try:
        image_bytes = prescription.prescription.read()
    finally:
        prescription.prescription.close()


    # =========================================
    # GEMINI
    # =========================================

    gemini_result = read_medicines_from_image(
        image_bytes
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