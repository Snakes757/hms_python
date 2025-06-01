# admin_dashboard/serializers.py
from rest_framework import serializers
from .models import DashboardPreference
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for the DashboardPreference model.
    Handles validation and data transformation for dashboard preference settings.
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = DashboardPreference
        fields = [
            'id',
            'user', # Writable, expects user ID
            'user_email', # Read-only display of user's email
            'default_report_on_load',
            'items_per_page_reports',
            'dashboard_theme',
            'last_updated'
        ]
        read_only_fields = ['id', 'last_updated', 'user_email']
        extra_kwargs = {
            'user': {'write_only': True, 'required': True},
        }

    def validate_user(self, value):
        """
        Validate that the user exists and is an admin or staff if specific logic is needed.
        For now, just ensures the user exists.
        """
        if not User.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("User does not exist.")
        # Add further validation if only specific user roles can have preferences
        # For example: if not value.is_staff:
        #    raise serializers.ValidationError("Only staff members can have admin dashboard preferences.")
        return value

    def create(self, validated_data):
        """
        Create a new DashboardPreference instance.
        Ensures that a user does not already have preferences set.
        """
        user = validated_data.get('user')
        if DashboardPreference.objects.filter(user=user).exists():
            raise serializers.ValidationError(
                {"user": "Dashboard preference already exists for this user."}
            )
        
        # If request context is available and user is not in validated_data,
        # attempt to set it from request.user. This is more typical if 'user' field is read_only
        # and set automatically. Since 'user' is write_only here, this block might be less relevant
        # unless the client is not expected to send the user ID.
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if not user: # If user was not provided in payload
                 validated_data['user'] = request.user
            elif user != request.user and not request.user.is_superuser: # Non-superuser trying to set for another user
                 raise serializers.ValidationError(
                    {"user": "You can only set dashboard preferences for yourself."}
                )


        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Update an existing DashboardPreference instance.
        The 'user' field cannot be changed on update.
        """
        validated_data.pop('user', None) # User associated with a preference should not change.
        
        # Similar to create, if request context is available, for security/consistency:
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if instance.user != request.user and not request.user.is_superuser:
                 raise serializers.ValidationError(
                    {"detail": "You can only update your own dashboard preferences."}
                )

        return super().update(instance, validated_data)
