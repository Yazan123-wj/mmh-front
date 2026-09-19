from django.urls import include, path
from rest_framework.routers import DefaultRouter

from cms.views import AdminBannerViewSet, AdminContentPageViewSet, AdminFAQViewSet, AdminSiteSettingsView

router = DefaultRouter()
router.register("banners", AdminBannerViewSet, basename="admin-banners")
router.register("faqs", AdminFAQViewSet, basename="admin-faqs")
router.register("pages", AdminContentPageViewSet, basename="admin-pages")

urlpatterns = [
    path("settings/", AdminSiteSettingsView.as_view()),
    path("", include(router.urls)),
]
