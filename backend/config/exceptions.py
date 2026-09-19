from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
import logging

logger = logging.getLogger("django.request")


def _code_for_status(http_status: int) -> str:
    if http_status == status.HTTP_400_BAD_REQUEST:
        return "validation_error"
    if http_status == status.HTTP_401_UNAUTHORIZED:
        return "authentication_error"
    if http_status == status.HTTP_403_FORBIDDEN:
        return "authorization_error"
    if http_status == status.HTTP_404_NOT_FOUND:
        return "not_found"
    if http_status == status.HTTP_409_CONFLICT:
        return "conflict"
    if http_status >= 500:
        return "server_error"
    return "error"


def api_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        # Normalize DRF errors without leaking internals / stack traces.
        code = _code_for_status(response.status_code)
        if isinstance(response.data, dict) and "detail" not in response.data:
            response.data = {"detail": response.data, "code": code}
        elif isinstance(response.data, dict):
            response.data.setdefault("code", code)
        elif isinstance(response.data, list):
            response.data = {"detail": response.data, "code": code}
        return response

    # Unknown exceptions — never expose stack traces to clients.
    logger.exception("Unhandled API exception")
    return Response(
        {"detail": "Internal server error", "code": "server_error"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
