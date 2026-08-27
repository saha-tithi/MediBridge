from PIL import Image

from transformers import (
    AutoImageProcessor,
    RobertaTokenizer,
    VisionEncoderDecoderModel,
)


MODEL_NAME = "microsoft/trocr-base-handwritten"


# =========================================
# LOAD MODEL COMPONENTS
# =========================================

image_processor = AutoImageProcessor.from_pretrained(
    MODEL_NAME
)

tokenizer = RobertaTokenizer.from_pretrained(
    MODEL_NAME
)

model = VisionEncoderDecoderModel.from_pretrained(
    MODEL_NAME
)


# =========================================
# OCR
# =========================================

def extract_text(file_path):

    image = Image.open(
        file_path
    ).convert("RGB")


    # Convert image into model input
    pixel_values = image_processor(
        images=image,
        return_tensors="pt"
    ).pixel_values


    # Generate text
    generated_ids = model.generate(
        pixel_values
    )


    # Decode generated text
    text = tokenizer.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0]


    return text