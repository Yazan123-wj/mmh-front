from django.urls import path

from cms.views import BannerListView, ContentPageDetailView, FAQListView

urlpatterns = [
    path("banners/", BannerListView.as_view()),
    path("faqs/", FAQListView.as_view()),
    path("pages/<slug:slug>/", ContentPageDetailView.as_view()),
]
