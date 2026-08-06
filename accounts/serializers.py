from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True,min_length=8)

    class Meta:
        model=User
        fields=(
            "username",
            "email",
            "password",
            "phone_number",
        )
    def create(self,validate_data):
        password=validate_data.pop("password")
        user=User(**validate_data)
        user.set_password(password)
        user.save()

        return user


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
            "role",
            "created_at",
        )