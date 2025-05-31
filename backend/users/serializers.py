# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.utils.translation import gettext_lazy as _
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError


from .models import (
    CustomUser, UserRole,
    DoctorProfile, NurseProfile, ReceptionistProfile, HospitalAdministratorProfile
)
# PatientProfile is not a separate model here; Patient model is in patients.models

UserModel = get_user_model()

# --- Profile Serializers ---
class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ('specialization', 'license_number')
        extra_kwargs = {
            'specialization': {'required': False, 'allow_blank': True},
            'license_number': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

class NurseProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NurseProfile
        fields = ('department',)
        extra_kwargs = {
            'department': {'required': False, 'allow_blank': True},
        }

class ReceptionistProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceptionistProfile
        fields = () # Add specific fields if ReceptionistProfile model gets them

class HospitalAdministratorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalAdministratorProfile
        fields = () # Add specific fields if HospitalAdministratorProfile model gets them

# --- User Serializers ---
class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomUser model for general display purposes.
    Includes role display and role-specific profile information.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    profile = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='full_name_display', read_only=True) # Use the property

    class Meta:
        model = UserModel
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'profile',
            'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_login'
        )
        read_only_fields = (
            'id', 'full_name', 'role_display', 'profile',
            'is_staff', 'is_superuser', 'date_joined', 'last_login', 'is_active' # is_active typically admin controlled
        )

    def get_profile(self, obj):
        """
        Dynamically serializes the role-specific profile based on the user's role.
        """
        request = self.context.get('request')
        context_with_request = {'request': request} # Pass context for nested serializers if they need it

        profile_mapping = {
            UserRole.DOCTOR: (DoctorProfile, DoctorProfileSerializer, 'doctor_profile'),
            UserRole.NURSE: (NurseProfile, NurseProfileSerializer, 'nurse_profile'),
            UserRole.RECEPTIONIST: (ReceptionistProfile, ReceptionistProfileSerializer, 'receptionist_profile'),
            UserRole.ADMIN: (HospitalAdministratorProfile, HospitalAdministratorProfileSerializer, 'admin_profile'),
        }

        if obj.role in profile_mapping:
            _, profile_serializer_class, related_name = profile_mapping[obj.role]
            profile_instance = getattr(obj, related_name, None)
            if profile_instance:
                return profile_serializer_class(profile_instance, context=context_with_request).data
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Handles creation of CustomUser and associated role-specific profile.
    """
    password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'},
        min_length=10, # Consistent with settings.AUTH_PASSWORD_VALIDATORS
        help_text=_("Required. 10 characters or more.")
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'},
        label=_("Confirm password")
    )
    role = serializers.ChoiceField(choices=UserRole.choices, required=True)

    # Role-specific profile fields (optional at registration)
    specialization = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    license_number = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True, write_only=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)

    class Meta:
        model = UserModel
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role',
            'specialization', 'license_number', 'department', # Profile fields
        )
        extra_kwargs = {
            'username': {'required': True}, # Username is required
            'email': {'required': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }

    def validate_email(self, value):
        if UserModel.objects.filter(email__iexact=value).exists(): # Case-insensitive check
            raise serializers.ValidationError(_("A user with this email address already exists."))
        return value

    def validate_username(self, value):
        if UserModel.objects.filter(username__iexact=value).exists(): # Case-insensitive check
            raise serializers.ValidationError(_("This username is already taken. Please choose another."))
        return value

    def validate_password(self, value):
        try:
            validate_password(value) # Use Django's built-in password validators
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": _("Password fields didn't match.")})

        role = data.get('role')
        if role == UserRole.DOCTOR:
            if not data.get('specialization') and not data.get('license_number'):
                # Could make these optional or conditionally required based on policy
                pass
        elif role == UserRole.NURSE:
            if not data.get('department'):
                pass # Could make department optional
        return data

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None) # Remove confirm password

        # Pop profile-specific fields before creating CustomUser
        specialization = validated_data.pop('specialization', None)
        license_number = validated_data.pop('license_number', None)
        department = validated_data.pop('department', None)

        user = UserModel.objects.create_user(**validated_data, password=password)
        # Role-specific profiles are created by signals (users.signals.create_or_update_role_specific_profile)
        # If profile data was collected here, it can be passed to the signal or updated here.
        # For example, if the signal doesn't take extra args from serializer:
        if user.role == UserRole.DOCTOR:
            DoctorProfile.objects.update_or_create(
                user=user,
                defaults={'specialization': specialization, 'license_number': license_number}
            )
        elif user.role == UserRole.NURSE:
            NurseProfile.objects.update_or_create(
                user=user,
                defaults={'department': department}
            )
        # Patient profiles (Patient model) are handled by a separate signal in patients.signals
        return user

class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login. Validates credentials and returns user data + token.
    """
    email = serializers.EmailField(label=_("Email"), write_only=True)
    password = serializers.CharField(
        label=_("Password"), style={'input_type': 'password'},
        trim_whitespace=False, write_only=True
    )
    token = serializers.CharField(label=_("Token"), read_only=True) # For response

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError(_('Must include "email" and "password".'), code='authorization')

        user = authenticate(request=self.context.get('request'), email=email, password=password)
        if not user:
            raise serializers.ValidationError(_('Unable to log in with provided credentials. Please check email and password.'), code='authorization')
        if not user.is_active:
            raise serializers.ValidationError(_('User account is disabled.'), code='authorization')

        attrs['user'] = user
        return attrs

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for authenticated users to update limited fields of their own profile.
    Does not allow changing email or role here; those are admin actions or need verification.
    """
    # Role-specific profile fields, make them writable
    doctor_profile = DoctorProfileSerializer(required=False, allow_null=True)
    nurse_profile = NurseProfileSerializer(required=False, allow_null=True)
    # Add other profiles if they have updatable fields by the user

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'username', 'doctor_profile', 'nurse_profile')
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }

    def validate_username(self, value):
        # Ensure username uniqueness if it's being changed
        if self.instance and UserModel.objects.filter(username__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError(_("This username is already taken."))
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        # Pop profile data
        doctor_profile_data = validated_data.pop('doctor_profile', None)
        nurse_profile_data = validated_data.pop('nurse_profile', None)
        # ... pop other profiles

        # Update CustomUser fields
        instance = super().update(instance, validated_data)

        # Update role-specific profiles
        if instance.role == UserRole.DOCTOR and doctor_profile_data:
            DoctorProfile.objects.update_or_create(user=instance, defaults=doctor_profile_data)
        elif instance.role == UserRole.NURSE and nurse_profile_data:
            NurseProfile.objects.update_or_create(user=instance, defaults=nurse_profile_data)
        # ... update other profiles

        return instance

class AdminUserUpdateSerializer(CustomUserSerializer):
    """
    Serializer for Admins to update any user's details, including role and active status.
    Inherits from CustomUserSerializer for display fields.
    """
    # Make fields writable that are read_only in CustomUserSerializer for admin updates
    role = serializers.ChoiceField(choices=UserRole.choices, required=False)
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)
    is_superuser = serializers.BooleanField(required=False)

    # Allow updating profile data via nested serializers
    doctor_profile = DoctorProfileSerializer(required=False, allow_null=True)
    nurse_profile = NurseProfileSerializer(required=False, allow_null=True)
    receptionist_profile = ReceptionistProfileSerializer(required=False, allow_null=True)
    admin_profile = HospitalAdministratorProfileSerializer(required=False, allow_null=True)


    class Meta(CustomUserSerializer.Meta): # Inherit fields from CustomUserSerializer
        read_only_fields = ('id', 'full_name', 'role_display', 'profile', 'date_joined', 'last_login')
        # We allow 'role', 'is_active', etc. to be updated by admin.
        # 'profile' is a SerializerMethodField and read-only by nature. Nested profiles are handled explicitly.

    def validate_email(self, value):
        # Check uniqueness if email is being changed
        if self.instance and self.instance.email != value and \
           UserModel.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(_("A user with this email address already exists."))
        return value

    def validate_username(self, value):
        if self.instance and self.instance.username != value and \
           UserModel.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(_("This username is already taken."))
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        # Pop profile data
        doctor_profile_data = validated_data.pop('doctor_profile', None)
        nurse_profile_data = validated_data.pop('nurse_profile', None)
        receptionist_profile_data = validated_data.pop('receptionist_profile', None)
        admin_profile_data = validated_data.pop('admin_profile', None)

        # Update CustomUser fields
        # super().update() will handle standard fields like first_name, last_name, username, is_active etc.
        # Role change needs careful handling due to profiles.
        
        new_role = validated_data.get('role', instance.role)
        if new_role != instance.role:
            # If role changes, existing role-specific profile might need to be deleted.
            # This is complex and often better handled by a dedicated service or admin action.
            # For now, signals should create the new profile. Deletion of old one is manual or via another process.
            pass 
            
        instance = super().update(instance, validated_data) # Updates user fields

        # Update or create role-specific profiles based on the (potentially new) role
        # Signals will also attempt to do this, but explicit update here ensures data from payload is used.
        if instance.role == UserRole.DOCTOR and doctor_profile_data:
            DoctorProfile.objects.update_or_create(user=instance, defaults=doctor_profile_data)
        elif instance.role == UserRole.NURSE and nurse_profile_data:
            NurseProfile.objects.update_or_create(user=instance, defaults=nurse_profile_data)
        elif instance.role == UserRole.RECEPTIONIST and receptionist_profile_data:
            ReceptionistProfile.objects.update_or_create(user=instance, defaults=receptionist_profile_data)
        elif instance.role == UserRole.ADMIN and admin_profile_data:
            HospitalAdministratorProfile.objects.update_or_create(user=instance, defaults=admin_profile_data)

        return instance
