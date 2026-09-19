from __future__ import annotations

from django_filters import rest_framework as filters
from rest_framework import generics, serializers

from accounts.drf_permissions import HasAdminPermission, IsAdminUser
from audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = (
            "id",
            "actor",
            "actor_email",
            "action",
            "entity_type",
            "entity_id",
            "meta",
            "created_at",
        )


class AuditLogFilter(filters.FilterSet):
    action = filters.CharFilter()
    entity_type = filters.CharFilter()
    actor = filters.NumberFilter(field_name="actor_id")
    date_from = filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_to = filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = AuditLog
        fields = ["action", "entity_type", "actor"]


class AdminAuditListView(generics.ListAPIView):
    permission_classes = [IsAdminUser, HasAdminPermission]
    admin_permission = "audit.read"
    serializer_class = AuditLogSerializer
    filterset_class = AuditLogFilter
    search_fields = ["action", "entity_type", "entity_id", "actor__email"]
    queryset = AuditLog.objects.select_related("actor")
