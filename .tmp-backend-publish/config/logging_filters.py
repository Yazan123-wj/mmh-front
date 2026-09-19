from __future__ import annotations

import threading

_local = threading.local()


def set_request_id(request_id: str | None) -> None:
    _local.request_id = request_id or "-"


def get_request_id() -> str:
    return getattr(_local, "request_id", "-")


class RequestIdFilter:
    """Inject request_id into log records (set by RequestIdMiddleware)."""

    def filter(self, record):
        record.request_id = get_request_id()
        return True
