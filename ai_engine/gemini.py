import json
import os

from PIL import Image
from google import genai
from google.genai import types

from config.settings import env


# =========================================
# GEMINI CONFIGURATION
# =========================================

API_KEY = env("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is missing from config/.env"
    )


client = genai.Client(
    api_key=API_KEY
)


MODEL_NAME = "gemini-3.6-flash"


# =========================================
# PROMPT
# =========================================

PROMPT = """
You are a prescription-reading assistant for MediBridge.

The uploaded image contains ONLY the medicine portion of a
prescription.

Read the handwritten medicine names carefully.

Your job is ONLY to identify medicines visible in the image.

Do NOT guess medicines that are not clearly present.

For every medicine you can identify, return:

- written_name
- medicine_name
- dosage_form
- strength
- confidence

Rules:

1. written_name:
   Return the medicine name exactly as it appears as closely
   as possible, including abbreviations such as Tab or Cap.

2. medicine_name:
   Remove dosage-form words such as:
   Tab, Tablet, Cap, Capsule, Syrup, Inj, Injection, etc.
   Keep the actual medicine/brand name.

3. dosage_form:
   Examples:
   Tablet
   Capsule
   Syrup
   Injection
   Cream
   Drop

4. strength:
   Extract the strength ONLY if it is visible.
   Examples:
   500 mg
   650 mg
   5 mg
   10 ml

   If the strength cannot be read, return null.

5. confidence:
   Use only:
   high
   medium
   low

6. Do not invent or infer a strength.

7. Do not invent a medicine name.

8. Ignore:
   - patient name
   - doctor name
   - date
   - address
   - diagnosis
   - instructions
   - quantity
   - duration
   - unrelated handwriting

Return ONLY valid JSON.

The JSON must have exactly this structure:

{
    "medicines": [
        {
            "written_name": "...",
            "medicine_name": "...",
            "dosage_form": "...",
            "strength": "...",
            "confidence": "high"
        }
    ]
}

If no medicine can be identified, return:

{
    "medicines": []
}
"""


# =========================================
# READ MEDICINES FROM IMAGE
# =========================================

def read_medicines_from_image(file_path):

    print(
        "Starting Gemini prescription reading..."
    )

    image = Image.open(
        file_path
    ).convert("RGB")


    # =========================================
    # SEND IMAGE TO GEMINI
    # =========================================

    response = client.models.generate_content(
        model=MODEL_NAME,

        contents=[
            PROMPT,
            image,
        ],

        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
        ),
    )


    # =========================================
    # GET RESPONSE TEXT
    # =========================================

    response_text = response.text.strip()


    # =========================================
    # CONVERT JSON
    # =========================================

    try:

        result = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        raise ValueError(
            "Gemini returned invalid JSON"
        ) from error


    # =========================================
    # VALIDATE RESULT
    # =========================================

    if not isinstance(result, dict):

        raise ValueError(
            "Gemini response must be a JSON object"
        )


    if "medicines" not in result:

        raise ValueError(
            "Gemini response does not contain medicines"
        )


    if not isinstance(
        result["medicines"],
        list
    ):

        raise ValueError(
            "medicines must be a list"
        )


    # =========================================
    # NORMALIZE MEDICINE DATA
    # =========================================

    medicines = []

    for medicine in result["medicines"]:

        if not isinstance(
            medicine,
            dict
        ):
            continue


        medicines.append({

            "written_name":
                medicine.get(
                    "written_name",
                    ""
                ),

            "medicine_name":
                medicine.get(
                    "medicine_name",
                    ""
                ),

            "dosage_form":
                medicine.get(
                    "dosage_form"
                ),

            "strength":
                medicine.get(
                    "strength"
                ),

            "confidence":
                medicine.get(
                    "confidence",
                    "low"
                ),

        })


    return {
        "medicines": medicines
    }