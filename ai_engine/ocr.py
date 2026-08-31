from .gemini import read_medicines_from_image


def extract_text(file_path):
    """
    Compatibility wrapper.

    Gemini is now the active prescription reader.
    """

    result = read_medicines_from_image(
        file_path
    )

    medicines = result.get(
        "medicines",
        []
    )

    return "\n".join(
        medicine["written_name"]
        for medicine in medicines
    )