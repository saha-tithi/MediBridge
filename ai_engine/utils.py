import re


def clean_text(text):

    if not text:
        return ""

    text = text.upper()

    # Keep letters and numbers.
    # Do NOT replace 0 → O or 1 → I.
    text = re.sub(
        r"[^A-Z0-9\s]",
        " ",
        text
    )

    # Remove repeated spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()