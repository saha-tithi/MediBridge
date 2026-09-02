import json
import time

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


MODEL_NAME = "gemini-3.6-flash"

# 2 minutes per Gemini request
GEMINI_TIMEOUT = 120000

MAX_RETRIES = 3


def create_client():
    return genai.Client(
        api_key=API_KEY,
        http_options=types.HttpOptions(
            timeout=GEMINI_TIMEOUT
        )
    )


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


    # =========================================
    # OPEN IMAGE
    # =========================================

    try:

        image = Image.open(
            file_path
        ).convert("RGB")

    except Exception as error:

        raise ValueError(
            "Unable to open prescription image."
        ) from error


    # =========================================
    # GEMINI REQUEST WITH RETRIES
    # =========================================

    response = None

    last_error = None


    for attempt in range(1, MAX_RETRIES + 1):

        try:

            print(
                f"Gemini attempt {attempt}/{MAX_RETRIES}..."
            )


            # Create a fresh client for every attempt.
            # This avoids reusing a broken HTTP connection.
            client = create_client()


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


            print(
                "Gemini response received."
            )

            break


        except Exception as error:

            last_error = error

            print(
                f"Gemini attempt {attempt} failed:"
            )

            print(
                repr(error)
            )


            if attempt < MAX_RETRIES:

                delay = 3 * attempt

                print(
                    f"Retrying Gemini in {delay} seconds..."
                )

                time.sleep(delay)


    # =========================================
    # ALL ATTEMPTS FAILED
    # =========================================

    if response is None:

        raise RuntimeError(
            "Gemini could not process the prescription "
            "after multiple attempts."
        ) from last_error


    # =========================================
    # GET RESPONSE TEXT
    # =========================================

    response_text = response.text.strip()


    if not response_text:

        raise ValueError(
            "Gemini returned an empty response."
        )


    print(
        "Gemini raw response:"
    )

    print(
        response_text
    )


    # =========================================
    # CONVERT JSON
    # =========================================

    try:

        result = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        raise ValueError(
            "Gemini returned invalid JSON."
        ) from error


    # =========================================
    # VALIDATE RESULT
    # =========================================

    if not isinstance(result, dict):

        raise ValueError(
            "Gemini response must be a JSON object."
        )


    if "medicines" not in result:

        raise ValueError(
            "Gemini response does not contain medicines."
        )


    if not isinstance(
        result["medicines"],
        list
    ):

        raise ValueError(
            "medicines must be a list."
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


    print(
        "Gemini medicines:"
    )

    print(
        medicines
    )


    return {
        "medicines": medicines
    }