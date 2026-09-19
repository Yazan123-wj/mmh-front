from django.urls import path

from audit.views import AdminAuditListView

urlpatterns = [
    path("audit/", AdminAuditListView.as_view(), name="admin-audit"),
]
