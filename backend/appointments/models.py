from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Q # Ensure Q is imported if used in constraints

from patients.models import Patient
from users.models import UserRole # CustomUser is implicitly used via settings.AUTH_USER_MODEL

class AppointmentStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', _('Scheduled')
    CONFIRMED = 'CONFIRMED', _('Confirmed')
    CANCELLED_BY_PATIENT = 'CANCELLED_BY_PATIENT', _('Cancelled by Patient')
    CANCELLED_BY_STAFF = 'CANCELLED_BY_STAFF', _('Cancelled by Staff')
    COMPLETED = 'COMPLETED', _('Completed')
    NO_SHOW = 'NO_SHOW', _('No Show')
    RESCHEDULED = 'RESCHEDULED', _('Rescheduled') # This appointment is old; new one exists

class AppointmentType(models.TextChoices):
    GENERAL_CONSULTATION = 'GENERAL_CONSULTATION', _('General Consultation')
    SPECIALIST_VISIT = 'SPECIALIST_VISIT', _('Specialist Visit')
    FOLLOW_UP = 'FOLLOW_UP', _('Follow-up')
    TELEMEDICINE = 'TELEMEDICINE', _('Telemedicine')
    PROCEDURE = 'PROCEDURE', _('Procedure')
    CHECK_UP = 'CHECK_UP', _('Check-up')
    EMERGENCY = 'EMERGENCY', _('Emergency') # Added emergency type

class Appointment(models.Model):
    """
    Represents a scheduled appointment between a patient and a doctor.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE, # If patient profile is deleted, their appointments are too.
        related_name='appointments',
        verbose_name=_("Patient")
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, # If doctor account is deleted, keep appointment but set doctor to NULL.
        null=True, # A doctor must be assigned for a valid appointment, but SET_NULL requires null=True
        blank=False, # Make it required in forms/serializers
        related_name='doctor_appointments',
        limit_choices_to={'role': UserRole.DOCTOR}, # Ensure only users with DOCTOR role can be selected.
        verbose_name=_("Doctor")
    )
    scheduled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True, # Can be system-scheduled or by patient themselves, or staff.
        related_name='scheduled_appointments',
        verbose_name=_("Scheduled By"),
        help_text=_("User who scheduled the appointment (e.g., patient, receptionist, admin).")
    )
    appointment_type = models.CharField(
        max_length=50,
        choices=AppointmentType.choices,
        default=AppointmentType.GENERAL_CONSULTATION,
        verbose_name=_("Appointment Type")
    )
    appointment_date_time = models.DateTimeField(
        verbose_name=_("Appointment Date and Time")
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        default=30,
        verbose_name=_("Estimated Duration (minutes)"),
        help_text=_("Estimated duration of the appointment in minutes.")
    )
    status = models.CharField(
        max_length=30,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.SCHEDULED,
        verbose_name=_("Appointment Status"),
        db_index=True # Index for faster filtering by status
    )
    reason = models.TextField(
        blank=True,
        verbose_name=_("Reason for Appointment"),
        help_text=_("Brief reason provided by the patient or scheduler for the visit.")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Notes"),
        help_text=_("Internal notes by staff or additional details from patient during booking.")
    )
    original_appointment = models.ForeignKey(
        'self', # Self-referential foreign key for rescheduling
        on_delete=models.SET_NULL, # If original is deleted, this link becomes null
        null=True,
        blank=True,
        related_name='rescheduled_to',
        verbose_name=_("Original Appointment (if rescheduled)"),
        help_text=_("Link to the original appointment if this is a rescheduled one.")
    )
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        verbose_name = _("Appointment")
        verbose_name_plural = _("Appointments")
        ordering = ['appointment_date_time'] # Default ordering
        indexes = [
            models.Index(fields=['doctor', 'appointment_date_time']),
            models.Index(fields=['patient', 'appointment_date_time']),
            models.Index(fields=['status', 'appointment_date_time']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'appointment_date_time'],
                name='unique_doctor_time_appointment',
                # Condition to apply the constraint only for active/pending appointments
                condition=models.Q(status__in=[AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED])
            )
        ]

    def __str__(self):
        # Corrected: Use full_name_display property
        patient_name = self.patient.user.full_name_display if self.patient and self.patient.user else _("N/A")
        doctor_name = self.doctor.full_name_display if self.doctor else _("Unassigned")
        return _("%(type)s for %(patient)s with Dr. %(doctor)s on %(date)s") % {
            'type': self.get_appointment_type_display(),
            'patient': patient_name,
            'doctor': doctor_name,
            'date': self.appointment_date_time.strftime('%Y-%m-%d %H:%M') if self.appointment_date_time else _("N/A")
        }

    @property
    def is_upcoming(self):
        """Checks if the appointment is in the future and not in a final state."""
        if not self.appointment_date_time: return False
        return self.appointment_date_time > timezone.now() and self.status not in [
            AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED_BY_PATIENT,
            AppointmentStatus.CANCELLED_BY_STAFF, AppointmentStatus.NO_SHOW, AppointmentStatus.RESCHEDULED
        ]

    @property
    def is_past(self):
        """Checks if the appointment is in the past or in a final state."""
        if not self.appointment_date_time: return True # Treat as past if no datetime
        return self.appointment_date_time <= timezone.now() or self.status in [
            AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED_BY_PATIENT,
            AppointmentStatus.CANCELLED_BY_STAFF, AppointmentStatus.NO_SHOW, AppointmentStatus.RESCHEDULED
        ]

    def clean(self):
        """
        Custom validation for the Appointment model.
        """
        super().clean()
        # Prevent a doctor from being scheduled with themselves as a patient.
        if self.doctor and self.patient and self.doctor == self.patient.user:
            raise ValidationError(_("A doctor cannot be scheduled for an appointment with themselves as the patient."))

        # Validate appointment_date_time for new appointments (not in the past)
        if self.appointment_date_time and self.estimated_duration_minutes:
            if self.appointment_date_time < timezone.now() and not self.pk: # For new appointments
                # This validation might be better handled in forms/serializers for user-facing messages.
                # For model-level, it's a strict rule.
                pass # Consider if specific validation for past dates is needed here or in serializer

        # Validate original_appointment logic
        if self.original_appointment:
            if self.original_appointment == self:
                raise ValidationError(_("An appointment cannot be rescheduled to itself."))
            if self.original_appointment.status not in [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.RESCHEDULED]:
                # This check might be too restrictive if other statuses are allowed for rescheduling.
                # For now, it implies an original appointment should be in an active state to be rescheduled.
                pass

    def save(self, *args, **kwargs):
        """
        Overrides the save method to perform additional logic.
        """
        # Example: Ensure a doctor is assigned for non-emergency types (though model field `blank=False` handles this)
        if not self.doctor and self.appointment_type != AppointmentType.EMERGENCY: # Doctor is usually required
            # This might be redundant if `blank=False` on doctor field, but can be an explicit check.
            pass
        super().save(*args, **kwargs)
