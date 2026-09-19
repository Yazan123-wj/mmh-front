from __future__ import annotations

import uuid

from django.utils.deprecation import MiddlewareMixin

from config.logging_filters import set_request_id


class RequestIdMiddleware(MiddlewareMixin):
    """Attach a lightweight request id for log correlation (X-Request-ID)."""

    HEADER = "HTTP_X_REQUEST_ID"

    def process_request(self, request):
        rid = request.META.get(self.HEADER) or uuid.uuid4().hex[:16]
        request.request_id = rid
        set_request_id(rid)
        return None

    def process_response(self, request, response):
        rid = getattr(request, "request_id", None)
        if rid:
            response["X-Request-ID"] = rid
        set_request_id(None)
        return response
