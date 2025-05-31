# inquiries/serializers.py
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import Inquiry, InquiryStatus, InquirySource
from users.serializers import CustomUserSerializer
from patients.serializers import PatientSerializer
from users.models import CustomUser, UserRole
from patients.models import Patient

class InquirySerializer(serializers.ModelSerializer):
    """
    Serializer for the Inquiry model.
    Handles creation, validation, and representation of inquiry data.
    """
    handled_by_details = CustomUserSerializer(source='handled_by', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.select_related('user').filter(user__is_active=True),
        required=False, allow_null=True,
        help_text=_("ID of the patient this inquiry is related to (optional).")
    )
    handled_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(
            role__in=[UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.NURSE], is_active=True
        ),
        required=False, allow_null=True,
        help_text=_("ID of the staff member handling this inquiry (optional).")
    )
    # Make created_at writable on create, but read-only on update.
    created_at = serializers.DateTimeField(
        default=timezone.now,
        format="%Y-%m-%dT%H:%M:%S", # ISO 8601 for consistency
        help_text=_("Timestamp when the inquiry was received/created. Defaults to now if not provided.")
    )


    class Meta:
        model = Inquiry
        fields = (
            'id', 'subject', 'description',
            'inquirer_name', 'inquirer_email', 'inquirer_phone',
            'patient', 'patient_details',
            'source', 'source_display',
            'status', 'status_display',
            'handled_by', 'handled_by_details',
            'resolution_notes',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'updated_at', # created_at is default but can be overridden on create
            'handled_by_details', 'patient_details',
            'status_display', 'source_display'
        )
        extra_kwargs = {
            'subject': {'max_length': 255, 'required': True},
            'description': {'required': True},
            'inquirer_name': {'required': False, 'allow_blank': False}, # Must provide if no patient
            'inquirer_email': {'required': False, 'allow_null': True, 'allow_blank': True},
            'inquirer_phone': {'required': False, 'allow_blank': True},
            'resolution_notes': {'required': False, 'allow_blank': True},
            'created_at': {'required': False}, # Allow client to set if needed, defaults to now
        }

    def validate(self, data):
        # Get existing instance data if updating
        instance = self.instance

        patient = data.get('patient', getattr(instance, 'patient', None))
        inquirer_name = data.get('inquirer_name', getattr(instance, 'inquirer_name', None))
        inquirer_email = data.get('inquirer_email', getattr(instance, 'inquirer_email', None))
        inquirer_phone = data.get('inquirer_phone', getattr(instance, 'inquirer_phone', None))

        # Auto-fill inquirer details from patient if patient is provided and inquirer fields are empty
        if patient:
            if not inquirer_name:
                data['inquirer_name'] = patient.user.full_name
            if not inquirer_email and patient.user.email:
                data['inquirer_email'] = patient.user.email
            # Consider phone auto-fill if Patient model has it directly

        # Ensure some contact info or patient link exists
        final_inquirer_name = data.get('inquirer_name', getattr(instance, 'inquirer_name', None))
        final_inquirer_email = data.get('inquirer_email', getattr(instance, 'inquirer_email', None))
        final_inquirer_phone = data.get('inquirer_phone', getattr(instance, 'inquirer_phone', None))
        final_patient = data.get('patient', getattr(instance, 'patient', None))

        if not final_patient and not final_inquirer_name and not final_inquirer_email and not final_inquirer_phone:
            raise serializers.ValidationError(
                _("An inquiry must have an associated patient or at least one piece of inquirer contact information (name, email, or phone).")
            )
        
        # If status is Resolved or Closed, resolution_notes should be present
        status_val = data.get('status', getattr(instance, 'status', None))
        resolution_notes_val = data.get('resolution_notes', getattr(instance, 'resolution_notes', None))
        if status_val in [InquiryStatus.RESOLVED, InquiryStatus.CLOSED] and not resolution_notes_val:
            raise serializers.ValidationError(
                {"resolution_notes": _("Resolution notes are required when an inquiry is marked as Resolved or Closed.")}
            )
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None

        # If inquiry is submitted by an authenticated patient for themselves
        if user and user.role == UserRole.PATIENT:
            patient_profile = Patient.objects.filter(user=user).first()
            if patient_profile:
                validated_data['patient'] = patient_profile # Ensure patient is linked
                if not validated_data.get('inquirer_name'):
                    validated_data['inquirer_name'] = user.full_name
                if not validated_data.get('inquirer_email') and user.email:
                    validated_data['inquirer_email'] = user.email
        
        # Auto-assign handled_by if staff creates an inquiry and sets status to In Progress
        status_val = validated_data.get('status')
        if user and user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE]:
            if status_val == InquiryStatus.IN_PROGRESS and not validated_data.get('handled_by'):
                validated_data['handled_by'] = user
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None

        # Auto-assign handled_by if staff updates status to Resolved/Closed and no one is assigned
        new_status = validated_data.get('status')
        current_handled_by = instance.handled_by
        new_handled_by = validated_data.get('handled_by')

        if new_status in [InquiryStatus.RESOLVED, InquiryStatus.CLOSED]:
            if not current_handled_by and not new_handled_by: # If no one assigned and not being assigned
                if user and user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE]:
                    validated_data['handled_by'] = user # Assign current staff member

        # Prevent changing the associated patient by non-admins
        if 'patient' in validated_data and instance.patient != validated_data['patient']:
            if not (user and user.role == UserRole.ADMIN):
                raise serializers.ValidationError({"patient": _("Cannot change the associated patient of an existing inquiry unless you are an Administrator.")})
        
        return super().update(instance, validated_data)
