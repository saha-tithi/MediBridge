from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "phone_number",
            "password",
            "confirm_password",
        )

    def validate_email(self, value):
        value = value.lower()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "This username is already taken."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"].lower(),
            phone_number=validated_data.get("phone_number"),
            password=validated_data["password"],
            role=User.Role.CUSTOMER,
        )

        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    def validate(self, attrs):
        identifier = attrs.get("identifier")
        password = attrs.get("password")

        user = None

        if "@" in identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {
                        "identifier": "Invalid email/username or password."
                    }
                )

            user = authenticate(
                username=user.username,
                password=password,
            )

        else:
            user = authenticate(
                username=identifier,
                password=password,
            )

        if user is None:
            raise serializers.ValidationError(
                {
                    "identifier": "Invalid email/username or password."
                }
            )

        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone_number",
            "role",
            "created_at",
        )

        read_only_fields = (
            "id",
            "role",
            "created_at",
        )