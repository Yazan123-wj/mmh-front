from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from accounts.models import AdminProfile, CustomerProfile, UserKind
from accounts.permissions import user_permissions

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=160)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["full_name"],
            kind=UserKind.CUSTOMER,
        )
        CustomerProfile.objects.create(user=user, phone=validated_data.get("phone", ""))
        return user


class MeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "kind", "role", "permissions", "phone")

    def get_role(self, obj):
        profile = getattr(obj, "admin_profile", None)
        return profile.role if profile else None

    def get_permissions(self, obj):
        return sorted(user_permissions(obj))

    def get_phone(self, obj):
        profile = getattr(obj, "customer_profile", None)
        return profile.phone if profile else ""
