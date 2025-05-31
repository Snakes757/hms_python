# medical_management/serializers.py
from rest_framework import serializers
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .models import Prescription, Treatment, Observation
from patients.serializers import PatientSerializer, MedicalRecordSerializer # Assuming MedicalRecordSerializer exists
from users.serializers import CustomUserSerializer
from appointments.serializers import AppointmentSerializer # Assuming AppointmentSerializer exists

from patients.models import Patient, MedicalRecord
from users.models import CustomUser, UserRole
from appointments.models import Appointment

# Base serializer for common fields in medical management records
class BaseMedicalRecordItemSerializer(serializers.ModelSerializer):
    """
    Abstract base serializer for medical items linked to a patient,
    and optionally to an appointment or medical record.
    """
    patient_details = PatientSerializer(source='patient', read_only=True)
    appointment_details = AppointmentSerializer(source='appointment', read_only=True, required=False, allow_null=True)
    medical_record_details = MedicalRecordSerializer(source='medical_record', read_only=True, required=False, allow_null=True)

    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.select_related('user').filter(user__is_active=True),
        help_text=_("ID of the patient this record belongs to.")
    )
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.all(), required=False, allow_null=True,
        help_text=_("ID of the associated appointment (optional).")
    )
    medical_record = serializers.PrimaryKeyRelatedField(
        queryset=MedicalRecord.objects.all(), required=False, allow_null=True,
        help_text=_("ID of the associated medical record entry (optional).")
    )

    # Common read-only fields for all inheriting serializers
    common_read_only_fields = (
        'id', 'created_at', 'updated_at',
        'patient_details', 'appointment_details', 'medical_record_details'
    )

    class Meta:
        abstract = True # This base class should not be registered as a serializer itself.
        # Fields will be defined in subclasses, along with the model.

    def _validate_future_datetime(self, value, field_name):
        """Helper to validate that a datetime field is not in the future."""
        if value and value > timezone.now():
            raise serializers.ValidationError({field_name: _(f"{field_name.replace('_', ' ').title()} cannot be in the future.")})
        return value

    def _set_actor_if_none(self, validated_data, actor_field_name, allowed_roles):
        """Helper to set actor (e.g., prescribed_by) from request user if not provided."""
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None

        if actor_field_name not in validated_data or not validated_data[actor_field_name]:
            if user and user.role in allowed_roles:
                validated_data[actor_field_name] = user
            else:
                raise serializers.ValidationError({
                    actor_field_name: _(f"{actor_field_name.replace('_', ' ').title()} is required or the current user does not have the appropriate role.")
                })
        return validated_data


class PrescriptionSerializer(BaseMedicalRecordItemSerializer):
    """
    Serializer for the Prescription model.
    """
    prescribed_by_details = CustomUserSerializer(source='prescribed_by', read_only=True)
    prescribed_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=UserRole.DOCTOR, is_active=True),
        help_text=_("ID of the doctor who prescribed the medication.")
    )
    prescription_date = serializers.DateField(default=timezone.now().date)


    class Meta(BaseMedicalRecordItemSerializer.Meta): # Inherit Meta from base
        model = Prescription
        fields = BaseMedicalRecordItemSerializer.common_read_only_fields + (
            'patient', 'prescribed_by', 'appointment', 'medical_record',
            'medication_name', 'dosage', 'frequency', 'duration_days', 'instructions',
            'prescription_date', 'is_active',
            'prescribed_by_details',
        )
        read_only_fields = BaseMedicalRecordItemSerializer.common_read_only_fields + ('prescribed_by_details',)
        extra_kwargs = {
            'medication_name': {'required': True},
            'dosage': {'required': True},
            'frequency': {'required': True},
            'duration_days': {'min_value': 1, 'required': False, 'allow_null': True},
        }


    def validate_prescribed_by(self, value):
        if value.role != UserRole.DOCTOR:
            raise serializers.ValidationError(_("Prescriptions can only be issued by a Doctor."))
        return value

    def validate_prescription_date(self, value):
        if value and value > timezone.now().date(): # Compare with date part only
            raise serializers.ValidationError(_("Prescription date cannot be in the future."))
        return value

    def create(self, validated_data):
        validated_data = self._set_actor_if_none(validated_data, 'prescribed_by', [UserRole.DOCTOR])
        return super().create(validated_data)


class TreatmentSerializer(BaseMedicalRecordItemSerializer):
    """
    Serializer for the Treatment model.
    """
    administered_by_details = CustomUserSerializer(source='administered_by', read_only=True)
    administered_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role__in=[UserRole.DOCTOR, UserRole.NURSE], is_active=True),
        help_text=_("ID of the staff member (Doctor/Nurse) who administered the treatment.")
    )
    treatment_date_time = serializers.DateTimeField(default=timezone.now)

    class Meta(BaseMedicalRecordItemSerializer.Meta):
        model = Treatment
        fields = BaseMedicalRecordItemSerializer.common_read_only_fields + (
            'patient', 'administered_by', 'appointment', 'medical_record',
            'treatment_name', 'treatment_date_time', 'description', 'outcome', 'notes',
            'administered_by_details',
        )
        read_only_fields = BaseMedicalRecordItemSerializer.common_read_only_fields + ('administered_by_details',)
        extra_kwargs = {
            'treatment_name': {'required': True},
            'treatment_date_time': {'format': "%Y-%m-%dT%H:%M:%S"},
        }

    def validate_administered_by(self, value):
        if value.role not in [UserRole.DOCTOR, UserRole.NURSE]:
            raise serializers.ValidationError(_("Treatments can only be administered by a Doctor or Nurse."))
        return value

    def validate_treatment_date_time(self, value):
        return self._validate_future_datetime(value, 'treatment_date_time')

    def create(self, validated_data):
        validated_data = self._set_actor_if_none(validated_data, 'administered_by', [UserRole.DOCTOR, UserRole.NURSE])
        return super().create(validated_data)


class ObservationSerializer(BaseMedicalRecordItemSerializer):
    """
    Serializer for the Observation model.
    """
    observed_by_details = CustomUserSerializer(source='observed_by', read_only=True)
    observed_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role__in=[UserRole.DOCTOR, UserRole.NURSE], is_active=True),
        help_text=_("ID of the staff member (Doctor/Nurse) who made the observation.")
    )
    observation_date_time = serializers.DateTimeField(default=timezone.now)

    class Meta(BaseMedicalRecordItemSerializer.Meta):
        model = Observation
        fields = BaseMedicalRecordItemSerializer.common_read_only_fields + (
            'patient', 'observed_by', 'appointment', 'medical_record',
            'observation_date_time', 'symptoms_observed', 'vital_signs', 'description', 'notes',
            'observed_by_details',
        )
        read_only_fields = BaseMedicalRecordItemSerializer.common_read_only_fields + ('observed_by_details',)
        extra_kwargs = {
            'observation_date_time': {'format': "%Y-%m-%dT%H:%M:%S"},
        }

    def validate_observed_by(self, value):
        if value.role not in [UserRole.DOCTOR, UserRole.NURSE]:
            raise serializers.ValidationError(_("Observations can only be made by a Doctor or Nurse."))
        return value

    def validate_observation_date_time(self, value):
        return self._validate_future_datetime(value, 'observation_date_time')
    
    def validate(self, data):
        # Ensure at least one of symptoms, description, or vital_signs is provided
        symptoms = data.get('symptoms_observed', getattr(self.instance, 'symptoms_observed', None))
        description = data.get('description', getattr(self.instance, 'description', None))
        vitals = data.get('vital_signs', getattr(self.instance, 'vital_signs', None))

        if not symptoms and not description and not vitals:
            raise serializers.ValidationError(
                _("An observation must include at least one of: symptoms, description, or vital signs.")
            )
        return data

    def create(self, validated_data):
        validated_data = self._set_actor_if_none(validated_data, 'observed_by', [UserRole.DOCTOR, UserRole.NURSE])
        return super().create(validated_data)
