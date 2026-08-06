from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    message = "Request failed."

    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = response.data["detail"]
            errors = None
        else:
            errors = response.data
    else:
        errors = response.data

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }

    return response