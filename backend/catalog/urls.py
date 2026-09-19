from django.urls import path

from catalog.views import CategoryListView, PlatformListView, ProductDetailView, ProductListView, RegionListView

urlpatterns = [
    path("categories/", CategoryListView.as_view()),
    path("platforms/", PlatformListView.as_view()),
    path("regions/", RegionListView.as_view()),
    path("products/", ProductListView.as_view()),
    path("products/<slug:slug>/", ProductDetailView.as_view()),
]
