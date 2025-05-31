from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

# Import for encrypted fields - assuming django-cryptography
# from django_cryptography.fields import EncryptedCharField, EncryptedTextField, EncryptedJSONField
# Make sure 'cryptography' is in INSTALLED_APPS and FERNET_KEYS is set in settings.py


from patients.models import Patient, MedicalRecord
from users.models import UserRole # CustomUser is implicitly used via settings.AUTH_USER_MODEL
from appointments.models import Appointment

class Prescription(models.Model):
    """
    Prescription model.
    Sensitive fields like dosage, frequency, and instructions should be encrypted.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        verbose_name=_("Patient")
    )
    prescribed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='prescriptions_made',
        limit_choices_to={'role': UserRole.DOCTOR},
        verbose_name=_("Prescribed By (Doctor)")
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='prescriptions_from_appointment',
        verbose_name=_("Associated Appointment (Optional)")
    )
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='prescriptions_in_record',
        verbose_name=_("Associated Medical Record (Optional)")
    )
    medication_name = models.CharField(max_length=255, verbose_name=_("Medication Name"))
    # dosage = EncryptedCharField(max_length=100, verbose_name=_("Dosage")) # MODIFIED: Was models.CharField
    dosage = models.CharField(max_length=100, verbose_name=_("Dosage")) # Placeholder: Replace with EncryptedCharField
    # frequency = EncryptedCharField(
    #     max_length=100,
    #     verbose_name=_("Frequency"),
    #     help_text=_("e.g., Twice a day, Every 6 hours")
    # ) # MODIFIED: Was models.CharField
    frequency = models.CharField(
        max_length=100,
        verbose_name=_("Frequency"),
        help_text=_("e.g., Twice a day, Every 6 hours")
    ) # Placeholder: Replace with EncryptedCharField
    duration_days = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name=_("Duration (days)"),
        help_text=_("Duration of the prescription in days, if applicable.")
    )
    # instructions = EncryptedTextField(
    #     blank=True,
    #     verbose_name=_("Instructions for Use"),
    #     help_text=_("Specific instructions for the patient on how to take the medication.")
    # ) # MODIFIED: Was models.TextField
    instructions = models.TextField(
        blank=True,
        verbose_name=_("Instructions for Use"),
        help_text=_("Specific instructions for the patient on how to take the medication.")
    ) # Placeholder: Replace with EncryptedTextField
    prescription_date = models.DateField( # Consider EncryptedDateField
        default=timezone.now,
        verbose_name=_("Prescription Date")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
        help_text=_("Indicates if the prescription is currently active. Can be set to False if discontinued.")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Record Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Record Updated At"))

    class Meta:
        verbose_name = _("Prescription")
        verbose_name_plural = _("Prescriptions")
        ordering = ['-prescription_date', 'medication_name']
        indexes = [
            models.Index(fields=['patient', 'prescription_date']),
            models.Index(fields=['prescribed_by', 'prescription_date']),
            models.Index(fields=['is_active', 'prescription_date']),
        ]

    def __str__(self):
        patient_name = self.patient.user.full_name_display if self.patient and self.patient.user else _("N/A")
        return f"{self.medication_name} ({self.dosage}) for {patient_name}"

    def clean(self):
        super().clean()
        if self.prescription_date and self.prescription_date > timezone.now().date():
            raise ValidationError({'prescription_date': _("Prescription date cannot be in the future.")})
        if self.duration_days is not None and self.duration_days <= 0:
            raise ValidationError({'duration_days': _("Duration must be a positive number of days if specified.")})

class Treatment(models.Model):
    """
    Treatment model.
    Sensitive fields like description, outcome, and notes should be encrypted.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='treatments_received',
        verbose_name=_("Patient")
    )
    administered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='treatments_administered',
        limit_choices_to={'role__in': [UserRole.DOCTOR, UserRole.NURSE]},
        verbose_name=_("Administered By (Doctor/Nurse)")
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='treatments_in_appointment',
        verbose_name=_("Associated Appointment (Optional)")
    )
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='treatments_in_record',
        verbose_name=_("Associated Medical Record (Optional)")
    )
    treatment_name = models.CharField(max_length=255, verbose_name=_("Treatment Name"))
    treatment_date_time = models.DateTimeField(verbose_name=_("Treatment Date and Time"), default=timezone.now) # Consider EncryptedDateTimeField
    # description = EncryptedTextField(blank=True, verbose_name=_("Description of Treatment")) # MODIFIED: Was models.TextField
    description = models.TextField(blank=True, verbose_name=_("Description of Treatment")) # Placeholder: Replace with EncryptedTextField
    # outcome = EncryptedTextField(blank=True, verbose_name=_("Outcome/Result of Treatment")) # MODIFIED: Was models.TextField
    outcome = models.TextField(blank=True, verbose_name=_("Outcome/Result of Treatment")) # Placeholder: Replace with EncryptedTextField
    # notes = EncryptedTextField(blank=True, verbose_name=_("Additional Notes (Treatment)")) # MODIFIED: Was models.TextField
    notes = models.TextField(blank=True, verbose_name=_("Additional Notes (Treatment)")) # Placeholder: Replace with EncryptedTextField
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Record Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Record Updated At"))

    class Meta:
        verbose_name = _("Treatment")
        verbose_name_plural = _("Treatments")
        ordering = ['-treatment_date_time']
        indexes = [
            models.Index(fields=['patient', 'treatment_date_time']),
            models.Index(fields=['administered_by', 'treatment_date_time']),
        ]

    def __str__(self):
        patient_name = self.patient.user.full_name_display if self.patient and self.patient.user else _("N/A")
        return f"{self.treatment_name} for {patient_name} on {self.treatment_date_time.strftime('%Y-%m-%d %H:%M')}"

    def clean(self):
        super().clean()
        if self.treatment_date_time and self.treatment_date_time > timezone.now():
            raise ValidationError({'treatment_date_time': _("Treatment date and time cannot be in the future.")})

class Observation(models.Model):
    """
    Observation model.
    Sensitive fields like symptoms_observed, vital_signs (JSON), description,
    and notes should be encrypted.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='observations_logged',
        verbose_name=_("Patient")
    )
    observed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='observations_made',
        limit_choices_to={'role__in': [UserRole.NURSE, UserRole.DOCTOR]},
        verbose_name=_("Observed By (Nurse/Doctor)")
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='observations_in_appointment',
        verbose_name=_("Associated Appointment (Optional)")
    )
    medical_record = models.ForeignKey(
        MedicalRecord,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='observations_in_record',
        verbose_name=_("Associated Medical Record (Optional)")
    )
    observation_date_time = models.DateTimeField( # Consider EncryptedDateTimeField
        default=timezone.now,
        verbose_name=_("Observation Date and Time")
    )
    # symptoms_observed = EncryptedTextField(blank=True, verbose_name=_("Symptoms Observed")) # MODIFIED: Was models.TextField
    symptoms_observed = models.TextField(blank=True, verbose_name=_("Symptoms Observed")) # Placeholder: Replace with EncryptedTextField
    # vital_signs = EncryptedJSONField( # MODIFIED: Was models.JSONField
    #     null=True, blank=True,
    #     verbose_name=_("Vital Signs"),
    #     help_text=_("e.g., {'temperature': '37C', 'blood_pressure': '120/80', 'heart_rate': '70bpm'}")
    # )
    vital_signs = models.JSONField(
        null=True, blank=True,
        verbose_name=_("Vital Signs"),
        help_text=_("e.g., {'temperature': '37C', 'blood_pressure': '120/80', 'heart_rate': '70bpm'}")
    ) # Placeholder: Replace with EncryptedJSONField
    # description = EncryptedTextField(verbose_name=_("Detailed Observation")) # MODIFIED: Was models.TextField
    description = models.TextField(verbose_name=_("Detailed Observation")) # Placeholder: Replace with EncryptedTextField
    # notes = EncryptedTextField(blank=True, verbose_name=_("Additional Notes (Observation)")) # MODIFIED: Was models.TextField
    notes = models.TextField(blank=True, verbose_name=_("Additional Notes (Observation)")) # Placeholder: Replace with EncryptedTextField
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Record Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Record Updated At"))

    class Meta:
        verbose_name = _("Observation")
        verbose_name_plural = _("Observations")
        ordering = ['-observation_date_time']
        indexes = [
            models.Index(fields=['patient', 'observation_date_time']),
            models.Index(fields=['observed_by', 'observation_date_time']),
        ]

    def __str__(self):
        observed_by_name = self.observed_by.full_name_display if self.observed_by else _('N/A')
        patient_name = self.patient.user.full_name_display if self.patient and self.patient.user else _("N/A")
        return f"Observation for {patient_name} by {observed_by_name} on {self.observation_date_time.strftime('%Y-%m-%d %H:%M')}"

    def clean(self):
        super().clean()
        if self.observation_date_time and self.observation_date_time > timezone.now():
            raise ValidationError({'observation_date_time': _("Observation date and time cannot be in the future.")})
        if not self.symptoms_observed and not self.description and not self.vital_signs:
            raise ValidationError(_("At least one of symptoms, description, or vital signs must be provided for an observation."))

