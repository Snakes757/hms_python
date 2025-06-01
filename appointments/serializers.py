from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, AppointmentStatus, AppointmentType
from patients.serializers import PatientSerializer # For displaying nested patient details
from users.serializers import CustomUserSerializer    # For displaying nested doctor/scheduler details
from users.models import CustomUser, UserRole         # For queryset filtering and validation
from patients.models import Patient                   # For queryset filtering

class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Appointment model.
    Handles serialization and deserialization of Appointment instances,
    including validation and representation of related objects.
    """
    # Read-only fields for displaying details of related objects
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = CustomUserSerializer(source='doctor', read_only=True)
    scheduled_by_details = CustomUserSerializer(source='scheduled_by', read_only=True)

    # Read-only fields for displaying choice field labels
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)

    # Writeable fields for related objects (using PrimaryKeyRelatedField for input)
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), # All active patients
        # write_only=True # Keep if you only want to show details via patient_details
    )
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=UserRole.DOCTOR, is_active=True), # Only active doctors
        # write_only=True
    )
    scheduled_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(is_active=True), # Any active user can schedule (e.g. patient, staff)
        required=False, # Can be set automatically based on request user
        allow_null=True,
        # write_only=True
    )
    original_appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.all(),
        required=False,
        allow_null=True
    )

    # Properties from the model
    is_upcoming = serializers.BooleanField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'patient', 'doctor', 'appointment_type', 'appointment_date_time',
            'estimated_duration_minutes', 'status', 'reason', 'notes',
            'original_appointment', 'created_at', 'updated_at', 'scheduled_by',
            # Detailed representations (read-only)
            'patient_details', 'doctor_details', 'scheduled_by_details',
            'status_display', 'appointment_type_display',
            'is_upcoming', 'is_past'
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at',
            'patient_details', 'doctor_details', 'scheduled_by_details',
            'status_display', 'appointment_type_display',
            'is_upcoming', 'is_past'
        )
        extra_kwargs = {
            # Example: if you want 'reason' to be optional on create but required on update for certain statuses
            # 'reason': {'required': False}
        }

    def validate_appointment_date_time(self, value):
        """
        Validate that new appointments are not scheduled in the past.
        Allows past dates for updates (e.g. correcting a record).
        """
        if self.instance is None and value < timezone.now(): # Only for new appointments
            raise serializers.ValidationError(_("Cannot schedule an appointment in the past."))
        
        # Add check for business hours if necessary
        # For example: if not (timezone.datetime(value.year, value.month, value.day, 8) <= value <= timezone.datetime(value.year, value.month, value.day, 18)):
        #     raise serializers.ValidationError(_("Appointment must be within business hours (8 AM - 6 PM)."))
        # if value.weekday() >= 5: # Saturday or Sunday
        #     raise serializers.ValidationError(_("Appointments cannot be scheduled on weekends."))
        return value

    def validate_doctor(self, value):
        """
        Validate that the assigned doctor has the DOCTOR role.
        """
        if value and value.role != UserRole.DOCTOR: # value could be None if allow_null=True on model
            raise serializers.ValidationError(_("The selected user for 'doctor' must have the DOCTOR role."))
        return value

    def validate_scheduled_by(self, value):
        """
        Validate the role of the user scheduling the appointment, if provided.
        """
        # This validation might be more relevant if 'scheduled_by' is always required
        # or if specific roles are disallowed from scheduling.
        # For now, assuming request.user will often set this.
        if value and value.role not in [UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]:
            # This list can be adjusted based on who is allowed to schedule
            raise serializers.ValidationError(_("Invalid role for 'scheduled_by'."))
        return value

    def validate(self, data):
        """
        Object-level validation for appointments.
        Checks for conflicting appointments and other business rules.
        """
        doctor = data.get('doctor')
        appointment_date_time = data.get('appointment_date_time')
        estimated_duration = data.get('estimated_duration_minutes', self.Meta.model.estimated_duration_minutes.field.default)

        # Exclude self if updating an existing appointment
        instance_id = self.instance.id if self.instance else None

        if doctor and appointment_date_time:
            # Check for doctor's conflicting appointments
            # This simple check is for exact start time. A more robust check would consider duration.
            # The model's UniqueConstraint handles exact time conflicts for active appointments.
            # For overlapping appointments, more complex logic is needed here or in a dedicated service.
            
            # Example of a more complex check (if not using DB constraint for overlaps):
            # appointment_end_time = appointment_date_time + timezone.timedelta(minutes=estimated_duration)
            # conflicting_appointments = Appointment.objects.filter(
            #     doctor=doctor,
            #     appointment_date_time__lt=appointment_end_time, # Starts before this one ends
            #     # Need to calculate end time of existing appointments to check if this one starts before they end
            #     # This requires storing/calculating end_time for existing appointments.
            # ).exclude(pk=instance_id).exclude(status__in=[AppointmentStatus.CANCELLED_BY_PATIENT, ...]) # Exclude final states
            # if conflicting_appointments.exists():
            #     raise serializers.ValidationError(
            #         _("Dr. %(doctor_name)s already has an overlapping appointment at this time.") % {'doctor_name': doctor.full_name}
            #     )
            pass # Relying on DB constraint for now for exact time for active appointments.

        # Ensure patient is not the same as the doctor
        patient = data.get('patient')
        if patient and doctor and patient.user == doctor:
            raise serializers.ValidationError(_("A doctor cannot book an appointment for themselves with themselves as the patient."))

        # If rescheduling, ensure the original appointment is marked appropriately
        if data.get('original_appointment') and data.get('status') != AppointmentStatus.RESCHEDULED:
            # When a new appointment is created as a reschedule of an old one,
            # the old one's status should typically be updated to RESCHEDULED.
            # This logic might be better handled in the view or a service layer.
            pass

        return data

    def create(self, validated_data):
        """
        Custom create method for an appointment.
        Sets 'scheduled_by' to the request user if not provided.
        """
        request = self.context.get('request')
        if 'scheduled_by' not in validated_data and request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['scheduled_by'] = request.user
        
        # If an original_appointment is provided, update its status
        original_appointment = validated_data.get('original_appointment')
        if original_appointment:
            if original_appointment.status not in [AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_STAFF, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW]:
                original_appointment.status = AppointmentStatus.RESCHEDULED
                original_appointment.save(update_fields=['status'])
            # The new appointment being created should have its status set appropriately, e.g., SCHEDULED.
            # validated_data['status'] = AppointmentStatus.SCHEDULED # Ensure it's set if not provided

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Custom update method for an appointment.
        Handles logic for status changes, e.g., if an appointment is rescheduled.
        """
        # If status is changed to RESCHEDULED, an original_appointment link might be cleared,
        # or a new appointment should be created and linked via original_appointment.
        # This serializer primarily handles updating the current instance.
        # Rescheduling often involves creating a new instance.
        
        # If status is changed to CANCELLED, log reason if provided.
        # if validated_data.get('status') in [AppointmentStatus.CANCELLED_BY_PATIENT, AppointmentStatus.CANCELLED_BY_STAFF]:
            # Add cancellation reason to notes if not already there, or use a dedicated field.
            # instance.notes = (instance.notes or "") + f"\nCancelled: {validated_data.get('cancellation_reason', 'No reason provided.')}"

        return super().update(instance, validated_data)
