from __future__ import annotations

from accounts.models import AdminRole, RolePermission, User, UserKind

ROLE_PERMISSIONS: dict[str, set[str]] = {
    AdminRole.SUPER_ADMIN: {"*"},
    AdminRole.ADMIN: {
        "catalog.read",
        "catalog.write",
        "orders.read",
        "orders.write",
        "orders.fulfill",
        "codes.read",
        "codes.manage",
        "codes.reveal",
        "customers.read",
        "customers.write",
        "content.read",
        "content.write",
        "suppliers.read",
        "suppliers.write",
        "audit.read",
        "admins.read",
        "admins.write",
        "settings.manage",
    },
    AdminRole.CATALOG_MANAGER: {
        "catalog.read",
        "catalog.write",
        "content.read",
        "content.write",
        "suppliers.read",
        "codes.read",
    },
    AdminRole.ORDER_MANAGER: {
        "orders.read",
        "orders.write",
        "orders.fulfill",
        "codes.read",
        "codes.manage",
        "codes.reveal",
        "customers.read",
    },
    AdminRole.CONTENT_MANAGER: {"content.read", "content.write", "catalog.read"},
    AdminRole.SUPPORT_AGENT: {"orders.read", "customers.read", "codes.read"},
    AdminRole.VIEWER: {
        "catalog.read",
        "orders.read",
        "customers.read",
        "content.read",
        "suppliers.read",
        "audit.read",
        "codes.read",
    },
}


def user_permissions(user: User) -> set[str]:
    if not user or not user.is_authenticated or user.disabled:
        return set()
    if user.is_superuser or user.kind == UserKind.ADMIN and getattr(user, "admin_profile", None) is None:
        if user.is_superuser:
            return {"*"}
    profile = getattr(user, "admin_profile", None)
    if not profile:
        return set()
    perms = set(ROLE_PERMISSIONS.get(profile.role, set()))
    if "*" in perms:
        return {"*"}
    db_keys = RolePermission.objects.filter(role=profile.role).values_list("permission__key", flat=True)
    perms.update(db_keys)
    return perms


def has_permission(user: User, key: str) -> bool:
    perms = user_permissions(user)
    return "*" in perms or key in perms
