# telemedicine/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.models import Q # Added this import

from patients.models import Patient
from users.models import UserRole # CustomUser is implicitly used via settings.AUTH_USER_MODEL
from appointments.models import Appointment, AppointmentType, AppointmentStatus as ApptStatus

class TelemedicineSessionStatus(models.TextChoices):
    SCHEDULED = 'SCHEDULED', _('Scheduled')
    AWAITING_HOST = 'AWAITING_HOST', _('Awaiting Host (Doctor)')
    AWAITING_GUEST = 'AWAITING_GUEST', _('Awaiting Guest (Patient)')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    COMPLETED = 'COMPLETED', _('Completed')
    CANCELLED = 'CANCELLED', _('Cancelled')
    FAILED = 'FAILED', _('Failed') # e.g., technical issues

class TelemedicineSession(models.Model):
    """
    Represents a telemedicine (virtual) consultation session.
    Can be linked to a pre-scheduled Appointment or be an ad-hoc session.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='telemedicine_sessions',
        verbose_name=_("Patient")
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, # Must be assigned for a valid session, but SET_NULL requires null=True
        blank=False, # Enforce in forms/serializers
        related_name='doctor_telemedicine_sessions',
        limit_choices_to={'role': UserRole.DOCTOR},
        verbose_name=_("Doctor")
    )
    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.SET_NULL, # If linked appointment is deleted, keep session but unlink.
        null=True, blank=True,
        related_name='telemedicine_session_details', # Access session from appointment
        limit_choices_to={'appointment_type': AppointmentType.TELEMEDICINE},
        verbose_name=_("Linked Appointment (Optional)"),
        help_text=_("Link to a pre-scheduled telemedicine appointment, if any.")
    )
    session_start_time = models.DateTimeField(
        verbose_name=_("Actual or Scheduled Session Start Time"),
        db_index=True
    )
    session_end_time = models.DateTimeField(
        null=True, blank=True,
        verbose_name=_("Actual Session End Time")
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name=_("Estimated Duration (minutes)"),
        help_text=_("Estimated duration if scheduled. Actual duration is calculated if end time is set.")
    )
    session_url = models.URLField(
        max_length=512, blank=True, null=True,
        verbose_name=_("Session URL"),
        help_text=_("Link to the video conference (e.g., Zoom, Google Meet).")
    )
    status = models.CharField(
        max_length=20,
        choices=TelemedicineSessionStatus.choices,
        default=TelemedicineSessionStatus.SCHEDULED,
        verbose_name=_("Session Status"),
        db_index=True
    )
    reason_for_consultation = models.TextField(
        blank=True,
        verbose_name=_("Reason for Consultation"),
        help_text=_("Brief reason for the virtual visit. Can be pre-filled from a linked appointment.")
    )
    doctor_notes = models.TextField(blank=True, verbose_name=_("Doctor's Notes (Post-Session)"))
    patient_feedback = models.TextField(blank=True, verbose_name=_("Patient Feedback (Post-Session)"))
    recording_url = models.URLField(
        max_length=512, blank=True, null=True,
        verbose_name=_("Session Recording URL (Optional)"),
        help_text=_("Link to the session recording, if available and consented.")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Record Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Record Updated At"))

    class Meta:
        verbose_name = _("Telemedicine Session")
        verbose_name_plural = _("Telemedicine Sessions")
        ordering = ['-session_start_time']
        indexes = [
            models.Index(fields=['patient', 'session_start_time']),
            models.Index(fields=['doctor', 'session_start_time']),
            models.Index(fields=['status', 'session_start_time']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'session_start_time'],
                name='unique_doctor_telemedicine_time',
                condition=Q(status__in=[ # This Q object is correctly placed
                    TelemedicineSessionStatus.SCHEDULED,
                    TelemedicineSessionStatus.AWAITING_HOST,
                    TelemedicineSessionStatus.AWAITING_GUEST,
                    TelemedicineSessionStatus.IN_PROGRESS
                ])
            )
        ]

    def __str__(self):
        patient_name = self.patient.user.full_name if self.patient and self.patient.user else _("N/A")
        doctor_name = self.doctor.full_name if self.doctor else _("N/A")
        start_time_str = self.session_start_time.strftime('%Y-%m-%d %H:%M') if self.session_start_time else _("N/A")
        return _("Telemedicine: %(patient)s with Dr. %(doctor)s on %(date)s (%(status)s)") % {
            'patient': patient_name, 'doctor': doctor_name, 'date': start_time_str, 'status': self.get_status_display()
        }

    @property
    def duration_minutes(self):
        """Calculates the actual duration if start and end times are set, otherwise returns estimated or 0."""
        if self.session_start_time and self.session_end_time and self.session_end_time > self.session_start_time:
            return int((self.session_end_time - self.session_start_time).total_seconds() / 60)
        return self.estimated_duration_minutes or 0
    duration_minutes.fget.short_description = _("Actual/Estimated Duration (min)")

    def clean(self):
        super().clean()
        if self.session_end_time and self.session_start_time and self.session_end_time < self.session_start_time:
            raise ValidationError({'session_end_time': _("Session end time cannot be before the start time.")})

        if self.appointment:
            if self.appointment.appointment_type != AppointmentType.TELEMEDICINE:
                 raise ValidationError({'appointment': _("Linked appointment must be of type TELEMEDICINE.")})
            # Auto-fill from appointment if creating and fields are empty
            if not self.pk: # Only on creation
                self.patient = self.appointment.patient
                self.doctor = self.appointment.doctor
                if not self.session_start_time: self.session_start_time = self.appointment.appointment_date_time
                if not self.estimated_duration_minutes: self.estimated_duration_minutes = self.appointment.estimated_duration_minutes
                if not self.reason_for_consultation and self.appointment.reason: self.reason_for_consultation = self.appointment.reason
        
        if not self.doctor: # Ensure doctor is assigned
            raise ValidationError({'doctor': _("A doctor must be assigned to the telemedicine session.")})
        
        if self.patient and self.doctor and self.patient.user == self.doctor: # Prevent self-booking
            raise ValidationError(_("A doctor cannot have a telemedicine session with themselves as the patient."))


    def save(self, *args, **kwargs):
        # self.full_clean() # Ensure model validation is run. Forms usually handle this.
        super().save(*args, **kwargs)

        # If session is completed, ensure linked appointment (if any) is also marked completed.
        if self.appointment and self.status == TelemedicineSessionStatus.COMPLETED:
            if self.appointment.status != ApptStatus.COMPLETED:
                self.appointment.status = ApptStatus.COMPLETED
                self.appointment.save(update_fields=['status'])
