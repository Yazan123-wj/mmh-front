from django.urls import path

from suppliers.views import OneEpinCallbackView, OneEpinReconcileView

urlpatterns = [
    path("1epin/callback/<str:token>/", OneEpinCallbackView.as_view()),
    path("1epin/reconcile/", OneEpinReconcileView.as_view()),
]
