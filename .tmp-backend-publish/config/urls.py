from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static

from config.health import HealthView, ReadinessView

urlpatterns = [
    path("health/", HealthView.as_view()),
    path("api/health/", HealthView.as_view()),
    path("api/ready/", ReadinessView.as_view()),
    path("django-admin/", admin.site.urls),
    path("api/v1/", include("config.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
