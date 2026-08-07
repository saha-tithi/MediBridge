import easyocr


reader = easyocr.Reader(["en"],gpu=False,)

def extract_text(file_path):

    result = reader.readtext(file_path)

    text = []

    for item in result:
        text.append(item[1])

    return "\n".join(text)