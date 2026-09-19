from django.urls import include, path
from rest_framework.routers import DefaultRouter

from catalog.views import (
    AdminCategoryViewSet,
    AdminInventoryView,
    AdminMediaAssetView,
    AdminMediaUploadView,
    AdminPlatformViewSet,
    AdminProductViewSet,
    AdminRegionViewSet,
    AdminSupplierMappingDetailView,
    AdminVariantViewSet,
)

router = DefaultRouter()
router.register("products", AdminProductViewSet, basename="admin-products")
router.register("variants", AdminVariantViewSet, basename="admin-variants")
router.register("categories", AdminCategoryViewSet, basename="admin-categories")
router.register("platforms", AdminPlatformViewSet, basename="admin-platforms")
router.register("regions", AdminRegionViewSet, basename="admin-regions")

urlpatterns = [
    path("inventory/", AdminInventoryView.as_view()),
    path("media/upload/", AdminMediaUploadView.as_view()),
    path("media/<int:media_id>/", AdminMediaAssetView.as_view()),
    path("supplier-mappings/<int:mapping_id>/", AdminSupplierMappingDetailView.as_view()),
    path("", include(router.urls)),
]
