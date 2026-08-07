from .ocr import extract_text
from .utils import clean_text
from .matcher import match_medicines


def process_prescription(prescription):

    # Get uploaded file path
    file_path = prescription.prescription.path

    # Extract text using OCR
    extracted_text = extract_text(file_path)

    # Clean extracted text
    cleaned_text = clean_text(extracted_text)

    # Match medicines from database
    medicines = match_medicines(cleaned_text)

    # Save results
    prescription.extracted_text = extracted_text
    prescription.extracted_medicines = medicines
    prescription.save(update_fields=["extracted_text","extracted_medicines",])

    return {"extracted_text": extracted_text,"medicines": medicines,}