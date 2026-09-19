from __future__ import annotations

from rest_framework.permissions import BasePermission

from accounts.permissions import has_permission
from accounts.models import UserKind


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and not user.disabled and user.kind == UserKind.CUSTOMER)


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and not user.disabled
            and (user.kind == UserKind.ADMIN or user.is_superuser)
        )


class HasAdminPermission(BasePermission):
    permission_key = ""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or user.disabled:
            return False
        if not (user.kind == UserKind.ADMIN or user.is_superuser):
            return False
        key = getattr(view, "admin_permission", None) or self.permission_key
        if not key:
            return True
        return has_permission(user, key)
