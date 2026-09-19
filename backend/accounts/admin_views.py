from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.drf_permissions import HasAdminPermission, IsAdminUser
from accounts.models import AdminProfile, AdminRole, CustomerProfile, Permission, RolePermission, UserKind
from accounts.permissions import has_permission
from accounts.serializers import MeSerializer
from commerce.models import Order, PaymentStatus

User = get_user_model()


class AdminCustomerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.first_name")
    disabled = serializers.BooleanField(source="user.disabled", read_only=True)

    class Meta:
        model = CustomerProfile
        fields = (
            "id",
            "email",
            "name",
            "phone",
            "status",
            "notes",
            "locale",
            "disabled",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at", "email", "disabled")


class AdminCustomerDetailSerializer(AdminCustomerSerializer):
    orders_count = serializers.SerializerMethodField()
    total_spent_fils = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()

    class Meta(AdminCustomerSerializer.Meta):
        fields = AdminCustomerSerializer.Meta.fields + (
            "orders_count",
            "total_spent_fils",
            "recent_orders",
        )

    def get_orders_count(self, obj):
        return Order.objects.filter(user=obj.user).count()

    def get_total_spent_fils(self, obj):
        return (
            Order.objects.filter(user=obj.user, payment_status=PaymentStatus.PAID).aggregate(
                total=Coalesce(Sum("total_fils"), 0)
            )["total"]
            or 0
        )

    def get_recent_orders(self, obj):
        orders = Order.objects.filter(user=obj.user).order_by("-created_at")[:10]
        return [
            {
                "id": o.id,
                "order_number": o.order_number,
                "total_fils": o.total_fils,
                "payment_status": o.payment_status,
                "fulfillment_status": o.fulfillment_status,
                "created_at": o.created_at,
            }
            for o in orders
        ]


class AdminCustomerPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ("phone", "status", "notes")


class CustomerListView(generics.ListAPIView):
    permission_classes = [IsAdminUser, HasAdminPermission]
    admin_permission = "customers.read"
    serializer_class = AdminCustomerSerializer
    queryset = CustomerProfile.objects.select_related("user").order_by("-created_at")
    search_fields = ["user__email", "user__first_name", "phone"]
    filterset_fields = ["status"]


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdminUser, HasAdminPermission]
    queryset = CustomerProfile.objects.select_related("user")
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        self.admin_permission = "customers.read" if self.request.method == "GET" else "customers.write"
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AdminCustomerPatchSerializer
        return AdminCustomerDetailSerializer


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="admin_profile.role")
    title = serializers.CharField(source="admin_profile.title", allow_blank=True, required=False)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "kind",
            "disabled",
            "role",
            "title",
            "permissions",
            "date_joined",
        )
        read_only_fields = ("kind", "date_joined", "permissions")

    def get_permissions(self, obj):
        from accounts.permissions import user_permissions

        return sorted(user_permissions(obj))


class CreateAdminSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=12, write_only=True)
    full_name = serializers.CharField(max_length=160)
    role = serializers.ChoiceField(choices=AdminRole.choices)
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["full_name"],
            kind=UserKind.ADMIN,
            is_staff=True,
        )
        AdminProfile.objects.create(
            user=user,
            role=validated_data["role"],
            title=validated_data.get("title", ""),
        )
        return user


class UpdateAdminSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=AdminRole.choices, required=False)
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)
    disabled = serializers.BooleanField(required=False)
    full_name = serializers.CharField(max_length=160, required=False)

    def update(self, instance, validated_data):
        profile = instance.admin_profile
        if "full_name" in validated_data:
            instance.first_name = validated_data["full_name"]
        if "disabled" in validated_data:
            if validated_data["disabled"] and profile.role == AdminRole.SUPER_ADMIN:
                remaining = AdminProfile.objects.filter(role=AdminRole.SUPER_ADMIN, user__disabled=False).exclude(
                    user=instance
                ).count()
                if remaining < 1:
                    raise serializers.ValidationError({"disabled": "Cannot disable the last SUPER_ADMIN"})
            instance.disabled = validated_data["disabled"]
        instance.save()
        if "role" in validated_data:
            if profile.role == AdminRole.SUPER_ADMIN and validated_data["role"] != AdminRole.SUPER_ADMIN:
                remaining = AdminProfile.objects.filter(role=AdminRole.SUPER_ADMIN, user__disabled=False).exclude(
                    user=instance
                ).count()
                if remaining < 1:
                    raise serializers.ValidationError({"role": "Cannot demote the last SUPER_ADMIN"})
            profile.role = validated_data["role"]
        if "title" in validated_data:
            profile.title = validated_data["title"]
        profile.save()
        return instance


class AdministratorViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser, HasAdminPermission]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            self.admin_permission = "admins.read"
        else:
            self.admin_permission = "admins.write"
        return super().get_permissions()

    def get_queryset(self):
        return (
            User.objects.filter(kind=UserKind.ADMIN)
            .select_related("admin_profile")
            .order_by("email")
        )

    def list(self, request):
        return Response(AdminUserSerializer(self.get_queryset(), many=True).data)

    def retrieve(self, request, pk=None):
        user = get_object_or_404(self.get_queryset(), pk=pk)
        return Response(AdminUserSerializer(user).data)

    def create(self, request):
        if not (
            request.user.is_superuser
            or getattr(getattr(request.user, "admin_profile", None), "role", None) == AdminRole.SUPER_ADMIN
            or has_permission(request.user, "admins.write")
        ):
            return Response({"detail": "Only SUPER_ADMIN can create admins"}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        user = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = UpdateAdminSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminUserSerializer(user).data)


class CreateAdminView(APIView):
    """Legacy POST /administrators/ create endpoint."""

    permission_classes = [IsAdminUser, HasAdminPermission]
    admin_permission = "admins.write"

    def post(self, request):
        if not (
            request.user.is_superuser
            or getattr(getattr(request.user, "admin_profile", None), "role", None) == AdminRole.SUPER_ADMIN
        ):
            return Response({"detail": "Only SUPER_ADMIN can create admins"}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(MeSerializer(user).data, status=status.HTTP_201_CREATED)


class RoleListView(APIView):
    permission_classes = [IsAdminUser, HasAdminPermission]
    admin_permission = "admins.read"

    def get(self, request):
        roles = []
        for role, label in AdminRole.choices:
            keys = list(
                RolePermission.objects.filter(role=role).values_list("permission__key", flat=True)
            )
            from accounts.permissions import ROLE_PERMISSIONS

            static = sorted(ROLE_PERMISSIONS.get(role, set()) - {"*"})
            roles.append(
                {
                    "role": role,
                    "label": label,
                    "permissions": sorted(set(keys) | set(static)) if "*" not in ROLE_PERMISSIONS.get(role, set()) else ["*"],
                }
            )
        return Response(roles)


class PermissionListView(APIView):
    permission_classes = [IsAdminUser, HasAdminPermission]
    admin_permission = "admins.read"

    def get(self, request):
        perms = Permission.objects.order_by("key")
        return Response([{"key": p.key, "description": p.description} for p in perms])


class RolePermissionsUpdateView(APIView):
    permission_classes = [IsAdminUser, HasAdminPermission]
    admin_permission = "admins.write"

    def put(self, request, role: str):
        if role not in AdminRole.values:
            return Response({"detail": "Unknown role"}, status=400)
        if not (
            request.user.is_superuser
            or getattr(getattr(request.user, "admin_profile", None), "role", None) == AdminRole.SUPER_ADMIN
            or has_permission(request.user, "admins.write")
        ):
            return Response({"detail": "Forbidden"}, status=403)
        keys = request.data.get("permissions")
        if not isinstance(keys, list):
            return Response({"detail": "permissions must be a list of keys"}, status=400)
        RolePermission.objects.filter(role=role).delete()
        for key in keys:
            perm = Permission.objects.filter(key=key).first()
            if not perm:
                return Response({"detail": f"Unknown permission: {key}"}, status=400)
            RolePermission.objects.create(role=role, permission=perm)
        return Response({"role": role, "permissions": keys})
