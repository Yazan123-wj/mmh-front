from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.admin_views import (
    AdministratorViewSet,
    CustomerDetailView,
    CustomerListView,
    PermissionListView,
    RoleListView,
    RolePermissionsUpdateView,
)

router = DefaultRouter()
router.register("administrators", AdministratorViewSet, basename="admin-administrators")

urlpatterns = [
    path("customers/", CustomerListView.as_view(), name="admin-customers"),
    path("customers/<int:pk>/", CustomerDetailView.as_view(), name="admin-customer-detail"),
    path("roles/", RoleListView.as_view(), name="admin-roles"),
    path("permissions/", PermissionListView.as_view(), name="admin-permissions"),
    path("roles/<str:role>/permissions/", RolePermissionsUpdateView.as_view(), name="admin-role-permissions"),
    path("", include(router.urls)),
]
