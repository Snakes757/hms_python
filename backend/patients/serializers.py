# patients/serializers.py
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import Patient, MedicalRecord, Gender
from users.serializers import CustomUserSerializer # For nested user details
from users.models import CustomUser, UserRole # For validation or filtering

class MedicalRecordSerializer(serializers.ModelSerializer):
    """
    Serializer for the MedicalRecord model.
    Handles creation, validation, and representation of medical record entries.
    """
    created_by_details = CustomUserSerializer(source='created_by', read_only=True)
    patient_full_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_email = serializers.EmailField(source='patient.user.email', read_only=True)


    created_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role__in=[UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN], is_active=True),
        required=False, allow_null=True, # Can be set by request user context
        help_text=_("ID of the staff member who created this record (Doctor, Nurse, Admin).")
    )
    # 'patient' field is typically set by the view context (e.g., URL parameter) for creation,
    # or is part of the instance for updates/retrieval.
    # If it needs to be writable for some use cases, ensure proper validation.
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        required=False, # Usually set by view context, not directly in payload for list/create
        help_text=_("ID of the patient this medical record belongs to.")
    )
    record_date = serializers.DateTimeField(default=timezone.now, format="%Y-%m-%dT%H:%M:%S")


    class Meta:
        model = MedicalRecord
        fields = (
            'id', 'patient', 'patient_full_name', 'patient_email', 'record_date',
            'diagnosis', 'symptoms', 'treatment_plan', 'notes',
            'created_by', 'created_by_details',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at',
            'created_by_details', 'patient_full_name', 'patient_email'
        )
        # 'patient' is often read-only or set by view context, not direct payload.
        # If made writable, ensure 'patient' in extra_kwargs has write_only=True if details are separate.

    def validate_created_by(self, value):
        if value and value.role not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            raise serializers.ValidationError(
                _("Medical records can only be created/managed by authorized staff (Doctor, Nurse, Admin).")
            )
        return value

    def validate_record_date(self, value):
        if value and value > timezone.now():
            raise serializers.ValidationError(_("Record date and time cannot be in the future."))
        return value
    
    def validate(self, data):
        # Ensure at least one of diagnosis, symptoms, treatment_plan, or notes is provided
        # This check is also in the model's clean method, but good to have in serializer too.
        instance = self.instance
        diagnosis = data.get('diagnosis', getattr(instance, 'diagnosis', None))
        symptoms = data.get('symptoms', getattr(instance, 'symptoms', None))
        treatment_plan = data.get('treatment_plan', getattr(instance, 'treatment_plan', None))
        notes = data.get('notes', getattr(instance, 'notes', None))

        if not diagnosis and not symptoms and not treatment_plan and not notes:
            raise serializers.ValidationError(
                _("A medical record entry must contain at least one of: diagnosis, symptoms, treatment plan, or notes.")
            )
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None

        # Set 'created_by' from the request user if not provided and user has appropriate role
        if 'created_by' not in validated_data or not validated_data['created_by']:
            if user and user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
                validated_data['created_by'] = user
            else: # If no user context or user has wrong role, and created_by not given
                if not validated_data.get('created_by'): # Check again if it was somehow set to None
                    raise serializers.ValidationError(
                        {"created_by": _("Creator (Doctor, Nurse, Admin) is required or must be an authenticated staff member.")}
                    )
        
        # 'patient' should be set by the view (e.g., from URL parameter) and passed to serializer.save()
        # or already present in validated_data if it was made writable.
        if 'patient' not in validated_data:
            # This case should ideally be handled by the view ensuring patient context.
            raise serializers.ValidationError({"patient": _("Patient must be specified for the medical record.")})

        return super().create(validated_data)

class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer for the Patient model (profile).
    Used for retrieving and updating patient profile information.
    The linked 'user' (CustomUser) details are nested and read-only.
    """
    user = CustomUserSerializer(read_only=True) # Nested user details
    age = serializers.IntegerField(read_only=True, help_text=_("Calculated age of the patient."))
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)

    class Meta:
        model = Patient
        # 'user' field itself (the PK) is not listed here as it's the PK and managed via the user instance.
        # The 'user' attribute above provides the nested CustomUser details.
        fields = (
            'user', # This will show the full CustomUserSerializer output. PK is user_id.
            'date_of_birth', 'gender', 'gender_display', 'address', 'phone_number',
            'emergency_contact_name', 'emergency_contact_phone',
            'age', 'created_at', 'updated_at'
        )
        # 'user' (the CustomUser object) is read-only here as it's tied to the Patient instance.
        # Patient profile fields are updatable.
        read_only_fields = ('user', 'age', 'gender_display', 'created_at', 'updated_at')
        extra_kwargs = {
            'date_of_birth': {'required': False, 'allow_null': True, 'format': "%Y-%m-%d"},
            'gender': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
            'emergency_contact_name': {'required': False, 'allow_blank': True},
            'emergency_contact_phone': {'required': False, 'allow_blank': True},
        }

    def validate_date_of_birth(self, value):
        if value and value > timezone.now().date():
            raise serializers.ValidationError(_("Date of birth cannot be in the future."))
        return value

class PatientDetailSerializer(PatientSerializer):
    """
    Detailed serializer for a Patient, including their medical records.
    Inherits from PatientSerializer and adds the 'medical_records' field.
    """
    medical_records = MedicalRecordSerializer(many=True, read_only=True)

    class Meta(PatientSerializer.Meta): # Inherit Meta from PatientSerializer
        fields = PatientSerializer.Meta.fields + ('medical_records',)
        # read_only_fields are inherited and 'medical_records' is read_only by default in its definition.
