import re


def clean_text(text):

    if not text:
        return ""

    text = text.upper()

    replacements = {
        "0": "O",
        "1": "I",
        "|": "I",
        "$": "S",
        "@": "A",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

   
    text = re.sub(r"[^A-Z0-9\s]", " ", text)

   
    text = re.sub(r"\s+", " ", text)

    return text.strip()