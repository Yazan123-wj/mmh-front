from __future__ import annotations

from django.db import connection
from django.http import JsonResponse
from django.views import View


class HealthView(View):
    """Lightweight liveness — does not require auth. Safe public fields only."""

    def get(self, request):
        return JsonResponse({"status": "ok"})


class ReadinessView(View):
    """Readiness — Django + database. Does not check OneEpin."""

    def get(self, request):
        db_ok = False
        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            db_ok = True
        except Exception:  # noqa: BLE001 — never leak DB details
            db_ok = False

        payload = {
            "status": "ok" if db_ok else "degraded",
            "database": "ok" if db_ok else "error",
        }
        return JsonResponse(payload, status=200 if db_ok else 503)
