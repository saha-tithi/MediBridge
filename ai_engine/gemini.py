import json
import random
import re
import time

from PIL import Image
from google import genai
from google.genai import types

from config.settings import env


# =========================================
# GEMINI CONFIGURATION
# =========================================

# Read with default="" and validated lazily inside create_client(), NOT here
# at import time. This module is reached from
# prescriptions/urls.py -> prescriptions/views.py -> ai_engine.services, so an
# eager raise above takes the ENTIRE site down - medicine list, cart, admin,
# every URL - whenever the key is merely unset. A missing AI credential should
# fail prescription OCR, not the whole application.
#
# default="" also avoids python-decouple's UndefinedValueError, which would
# otherwise fire before this guard could produce a readable message.
API_KEY = env("GEMINI_API_KEY", default="")


MODEL_NAME = "gemini-3.6-flash"

# 2 minutes per Gemini request
GEMINI_TIMEOUT = 120000

# Gemini intermittently answers with 503 "high demand". The original
# 3 attempts spaced 3s/6s (~9s of waiting) all landed inside the same
# spike, so every upload failed. 7 attempts over ~61s ride it out;
# non-transient errors (bad key, unknown model) bail out immediately.
MAX_RETRIES = 7

RETRY_BASE_DELAY = 1

MAX_RETRY_DELAY = 30

# HTTP statuses that retrying can never fix (bad key, unknown model,
# payload too large). Everything else — notably 429/5xx — is transient.
NON_RETRYABLE_STATUS_CODES = frozenset({400, 401, 403, 404, 413})

# Google embeds a RetryInfo detail in 429/503 bodies, e.g.
# 'retryDelay': '46s' or 'retryDelay': '416ms'. Honouring it beats
# guessing with exponential backoff.
RETRY_DELAY_RE = re.compile(
    r"retryDelay['\"]?\s*:\s*['\"]?(\d+(?:\.\d+)?)(ms|s)"
)

# Per-plan quota line, e.g.
# "... limit: 20, model: gemini-3.6-flash".
QUOTA_RE = re.compile(r"limit:\s*(\d+),\s*model:\s*([\w.-]+)")

# Total seconds this call may spend sleeping between attempts. A
# request that needs to wait longer than this is not worth blocking
# the customer's upload for — better to fail with a clear reason.
TOTAL_RETRY_BUDGET = 90


def create_client():
    if not API_KEY:
        # The key comes from config/.env locally, or straight from the process
        # environment on Render, which has no .env file at all.
        raise ValueError(
            "GEMINI_API_KEY is not set. Add it to config/.env for local "
            "development, or to the service environment on Render."
        )
    return genai.Client(
        api_key=API_KEY,
        http_options=types.HttpOptions(
            timeout=GEMINI_TIMEOUT
        )
    )


def is_retryable(error):
    """True when retrying this Gemini failure might succeed."""
    # A per-day quota (GenerateRequestsPerDay...) cannot recover
    # inside TOTAL_RETRY_BUDGET — burning 90s of retries only to
    # learn the same thing helps nobody.
    if "PerDay" in str(error):

        return False

    code = getattr(error, "code", None)

    # No HTTP status (timeout, connection reset, DNS hiccup) -> retry.
    if code is None:
        return True

    return code not in NON_RETRYABLE_STATUS_CODES


def server_retry_delay(error):
    """Seconds Google asked us to wait, or None if it did not say."""
    match = RETRY_DELAY_RE.search(str(error))

    if match is None:
        return None

    value = float(match.group(1))

    return value / 1000.0 if match.group(2) == "ms" else value


def describe_failure(error, attempts):
    """A message someone can act on, not a raw SDK dump."""
    quota = QUOTA_RE.search(str(error))

    if quota is not None:

        return (
            f"Gemini API quota exhausted: the current plan allows "
            f"{quota.group(1)} request(s) for {quota.group(2)}. "
            f"Wait for the quota to reset, or upgrade the API key's "
            f"plan. (gave up after {attempts} attempt(s))"
        )

    detail = repr(error)

    # repr() of some SDK/transport exceptions omits the status; the
    # code is the single most useful thing in a support request.
    code = getattr(error, "code", None)

    if code is not None:

        detail = f"HTTP {code}: {detail}"

    if len(detail) > 300:

        detail = detail[:300] + "..."

    return (
        f"Gemini could not process the prescription after "
        f"{attempts} attempt(s): {detail}"
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

    sleep_budget = 0.0


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


            if attempt >= MAX_RETRIES or not is_retryable(error):

                break


            # Exponential backoff — 1s, 2s, 4s, 8s, 16s, 30s — plus
            # up to 1s of jitter so simultaneous uploads do not retry
            # in lockstep. The first retry is deliberately quick: a
            # 503 spike is often over before a longer wait elapses.

            delay = (
                min(
                    RETRY_BASE_DELAY * (2 ** (attempt - 1)),
                    MAX_RETRY_DELAY,
                )
                + random.uniform(0, 1)
            )

            # Google's own RetryInfo beats our guess.
            asked = server_retry_delay(error)

            if asked is not None:

                delay = max(delay, asked)


            if sleep_budget + delay > TOTAL_RETRY_BUDGET:

                print(
                    "Gemini asked us to wait longer than the retry "
                    "budget allows; giving up."
                )

                break


            print(
                f"Retrying Gemini in {delay:.1f} seconds..."
            )

            time.sleep(delay)

            sleep_budget += delay


    # =========================================
    # ALL ATTEMPTS FAILED
    # =========================================

    if response is None:

        # Surface the real cause — a bare "after multiple attempts"
        # left the API consumer with no idea whether the key, model
        # or quota was at fault. describe_failure() turns the common
        # quota case into something actionable.
        raise RuntimeError(
            describe_failure(last_error, attempt)
        ) from last_error


    # =========================================
    # GET RESPONSE TEXT
    # =========================================

    # response.text is Optional[str] in the SDK — it is None when
    # the response has no candidates/parts (e.g. safety block).
    response_text = (response.text or "").strip()


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