from django.urls import include, path

urlpatterns = [
    path("auth/", include("accounts.urls")),
    path("catalog/", include("catalog.urls")),
    path("", include("commerce.urls")),
    path("cms/", include("cms.urls")),
    path("suppliers/", include("suppliers.urls")),
    path("admin/", include("config.admin_api_urls")),
]
