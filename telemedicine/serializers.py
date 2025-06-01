# telemedicine/serializers.py
from rest_framework import serializers
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db import transaction # For atomic operations if needed

from .models import TelemedicineSession, TelemedicineSessionStatus
from patients.serializers import PatientSerializer
from users.serializers import CustomUserSerializer
from appointments.serializers import AppointmentSerializer # For linked appointment details

from users.models import CustomUser, UserRole # Patient model is NOT here
from patients.models import Patient # Correct import for Patient model
from appointments.models import Appointment, AppointmentType # For validation

class TelemedicineSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for the TelemedicineSession model.
    Handles creation, validation, and representation of telemedicine session data.
    """
    patient_details = PatientSerializer(source='patient', read_only=True)
    doctor_details = CustomUserSerializer(source='doctor', read_only=True)
    appointment_details = AppointmentSerializer(source='appointment', read_only=True, required=False, allow_null=True)

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True, help_text=_("Actual or estimated duration in minutes."))

    # Writable fields for related objects
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.select_related('user').filter(user__is_active=True),
        help_text=_("ID of the patient for this telemedicine session.")
    )
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=UserRole.DOCTOR, is_active=True),
        help_text=_("ID of the doctor conducting this telemedicine session.")
    )
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.filter(appointment_type=AppointmentType.TELEMEDICINE)
                                  .select_related('patient__user', 'doctor'), # Optimize queryset
        required=False, allow_null=True,
        help_text=_("ID of the pre-scheduled telemedicine appointment linked to this session (optional).")
    )
    session_start_time = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S")
    session_end_time = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S", required=False, allow_null=True)


    class Meta:
        model = TelemedicineSession
        fields = (
            'id', 'patient', 'doctor', 'appointment',
            'session_start_time', 'session_end_time', 'estimated_duration_minutes',
            'session_url', 'status', 'reason_for_consultation',
            'doctor_notes', 'patient_feedback', 'recording_url',
            'created_at', 'updated_at',
            'patient_details', 'doctor_details', 'appointment_details', # Read-only nested details
            'status_display', 'duration_minutes' # Read-only display fields
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at',
            'patient_details', 'doctor_details', 'appointment_details',
            'status_display', 'duration_minutes'
        )
        extra_kwargs = {
            'estimated_duration_minutes': {'min_value': 1, 'required': False, 'allow_null': True},
            'session_url': {'max_length': 512, 'required': False, 'allow_blank': True, 'allow_null': True},
            'reason_for_consultation': {'required': False, 'allow_blank': True},
            'doctor_notes': {'required': False, 'allow_blank': True},
            'patient_feedback': {'required': False, 'allow_blank': True},
            'recording_url': {'max_length': 512, 'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def validate_session_start_time(self, value):
        # Allow scheduling slightly in the past for immediate ad-hoc sessions, but not too far.
        if not self.instance and value < (timezone.now() - timezone.timedelta(minutes=15)):
            raise serializers.ValidationError(
                _("Cannot schedule a telemedicine session more than 15 minutes in the past.")
            )
        return value

    def validate_session_end_time(self, value):
        # This validation is also present in the model's clean method.
        # It's good practice to have it at the serializer level for earlier feedback.
        start_time_str = self.initial_data.get('session_start_time')
        start_time = None

        if self.instance and not start_time_str: # If updating and start_time not in payload
            start_time = self.instance.session_start_time
        elif start_time_str:
            try:
                start_time = serializers.DateTimeField().to_internal_value(start_time_str)
            except serializers.ValidationError:
                 # Let DRF's field-level validation for session_start_time handle format errors
                pass
        
        if value and start_time and value < start_time:
            raise serializers.ValidationError(_("Session end time cannot be before the start time."))
        return value

    def validate_doctor(self, value):
        if value and value.role != UserRole.DOCTOR:
            raise serializers.ValidationError(_("The selected user for 'doctor' must have the DOCTOR role."))
        return value

    def validate_appointment(self, value):
        if value: # If an appointment is provided
            if value.appointment_type != AppointmentType.TELEMEDICINE:
                raise serializers.ValidationError(_("Linked appointment must be of type TELEMEDICINE."))

            # Check if this appointment is already linked to another TelemedicineSession
            # (excluding the current session if we are updating it).
            existing_session_qs = TelemedicineSession.objects.filter(appointment=value)
            if self.instance: # If updating, exclude the current instance from the check
                existing_session_qs = existing_session_qs.exclude(pk=self.instance.pk)
            
            if existing_session_qs.exists():
                existing_session = existing_session_qs.first()
                raise serializers.ValidationError(
                    _("This appointment (ID: %(appt_id)s) is already linked to telemedicine session (ID: %(session_id)s).") %
                    {'appt_id': value.id, 'session_id': existing_session.id}
                )
        return value

    def validate(self, data):
        """
        Cross-field validation for TelemedicineSession data.
        - Auto-fills session details from linked appointment if not provided.
        - Checks for doctor/patient self-booking.
        - Checks for doctor schedule conflicts (both telemedicine and regular appointments).
        """
        # Get current values or values from instance if updating and not in payload
        appointment = data.get('appointment', getattr(self.instance, 'appointment', None))
        patient = data.get('patient', getattr(self.instance, 'patient', None))
        doctor = data.get('doctor', getattr(self.instance, 'doctor', None))
        session_start_time = data.get('session_start_time', getattr(self.instance, 'session_start_time', None))
        
        # Auto-fill from appointment if one is linked and fields are empty
        if appointment:
            data['patient'] = appointment.patient # Override/set patient from appointment
            data['doctor'] = appointment.doctor   # Override/set doctor from appointment
            if not session_start_time: # If session_start_time wasn't in payload
                data['session_start_time'] = appointment.appointment_date_time
            if 'estimated_duration_minutes' not in data and appointment.estimated_duration_minutes:
                data['estimated_duration_minutes'] = appointment.estimated_duration_minutes
            if 'reason_for_consultation' not in data and appointment.reason:
                data['reason_for_consultation'] = appointment.reason
            # Update local vars for subsequent checks
            patient = data['patient']
            doctor = data['doctor']
            session_start_time = data['session_start_time']

        if not doctor: # Doctor is mandatory (model blank=False)
            raise serializers.ValidationError({"doctor": _("A doctor must be assigned to the telemedicine session.")})

        if patient and doctor and patient.user == doctor:
            raise serializers.ValidationError(
                _("A doctor cannot have a telemedicine session with themselves as the patient.")
            )

        # Check for doctor schedule conflicts (DB constraint 'unique_doctor_telemedicine_time' handles some cases)
        # This serializer validation provides earlier feedback.
        if doctor and session_start_time:
            estimated_duration = data.get('estimated_duration_minutes', getattr(self.instance, 'estimated_duration_minutes', TelemedicineSession._meta.get_field('estimated_duration_minutes').default) or 30)
            session_end_time_calc = session_start_time + timezone.timedelta(minutes=estimated_duration)
            
            current_session_id = self.instance.id if self.instance else None
            active_statuses = [
                TelemedicineSessionStatus.SCHEDULED, TelemedicineSessionStatus.AWAITING_HOST,
                TelemedicineSessionStatus.AWAITING_GUEST, TelemedicineSessionStatus.IN_PROGRESS
            ]

            # Check conflicting TelemedicineSessions
            conflicting_tele_sessions = TelemedicineSession.objects.filter(
                doctor=doctor, status__in=active_statuses,
                session_start_time__lt=session_end_time_calc, # Existing starts before new one ends
            ).exclude(pk=current_session_id)
            for ts in conflicting_tele_sessions:
                existing_ts_end_time = ts.session_start_time + timezone.timedelta(minutes=ts.estimated_duration_minutes or 30)
                if session_start_time < existing_ts_end_time: # New one starts before existing one ends
                    raise serializers.ValidationError(
                        _("Dr. %(doctor_name)s has a conflicting telemedicine session (ID: %(ts_id)s) from %(start)s to %(end)s.") %
                        {'doctor_name': doctor.full_name, 'ts_id': ts.id, 'start': ts.session_start_time.strftime('%H:%M'), 'end': existing_ts_end_time.strftime('%H:%M')}
                    )

            # Check conflicting regular Appointments
            conflicting_appointments = Appointment.objects.filter(
                doctor=doctor,
                status__in=[Appointment.AppointmentStatus.SCHEDULED, Appointment.AppointmentStatus.CONFIRMED],
                appointment_date_time__lt=session_end_time_calc
            ).exclude(pk=appointment.id if appointment else None) # Exclude the linked appointment
            for appt in conflicting_appointments:
                existing_appt_end_time = appt.appointment_date_time + timezone.timedelta(minutes=appt.estimated_duration_minutes)
                if session_start_time < existing_appt_end_time:
                     raise serializers.ValidationError(
                        _("Dr. %(doctor_name)s has a conflicting regular appointment (ID: %(appt_id)s) from %(start)s to %(end)s.") %
                        {'doctor_name': doctor.full_name, 'appt_id': appt.id, 'start': appt.appointment_date_time.strftime('%H:%M'), 'end': existing_appt_end_time.strftime('%H:%M')}
                    )
        return data

    @transaction.atomic
    def create(self, validated_data):
        # Auto-fill from appointment is handled in validate()
        # Set scheduled_by if applicable (though TelemedicineSession doesn't have this field directly)
        # The user creating the session is implicitly the actor.
        session = super().create(validated_data)
        # Model's save method handles updating linked Appointment status if session is COMPLETED.
        return session

    @transaction.atomic
    def update(self, instance, validated_data):
        # Auto-fill from appointment is handled in validate()
        session = super().update(instance, validated_data)
        # Model's save method handles updating linked Appointment status if session is COMPLETED.
        return session
