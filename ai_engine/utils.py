import re


# =========================================
# DOSAGE FORM WORDS
# =========================================

DOSAGE_FORMS = {
    "TAB",
    "TABLET",
    "TABLETS",
    "CAP",
    "CAPSULE",
    "CAPSULES",
    "SYP",
    "SYRUP",
    "INJ",
    "INJECTION",
    "DROP",
    "DROPS",
    "CREAM",
    "OINTMENT",
    "GEL",
    "LOTION",
    "SUSP",
    "SUSPENSION",
}


# =========================================
# NORMALIZE MEDICINE NAME
# =========================================

def normalize_medicine_name(name):

    if not name:
        return ""


    name = str(name).upper().strip()


    # -----------------------------------------
    # Remove unwanted characters
    # -----------------------------------------

    name = re.sub(
        r"[^A-Z0-9\s\-]",
        " ",
        name
    )


    # -----------------------------------------
    # Normalize spaces
    # -----------------------------------------

    name = re.sub(
        r"\s+",
        " ",
        name
    ).strip()


    # -----------------------------------------
    # Remove dosage form from beginning
    # -----------------------------------------

    words = name.split()


    if words and words[0] in DOSAGE_FORMS:

        words = words[1:]


    return " ".join(words)


# =========================================
# CLEAN OCR/GEMINI TEXT
# =========================================

def clean_text(text):

    if not text:
        return ""


    text = str(text).upper()


    text = re.sub(
        r"\s+",
        " ",
        text
    )


    return text.strip()