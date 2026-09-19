from django.urls import include, path

urlpatterns = [
    path("", include("accounts.admin_urls")),
    path("", include("catalog.admin_urls")),
    path("", include("commerce.admin_urls")),
    path("", include("cms.admin_urls")),
    path("", include("suppliers.admin_urls")),
    path("", include("audit.admin_urls")),
]
