from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings # For OneToOneField to AUTH_USER_MODEL
from django.utils import timezone
from django.core.exceptions import ValidationError

# Import for encrypted fields - assuming django-cryptography
# from cryptography.fernet import Fernet # Not directly used here, but for key generation
# from django_cryptography.fields import EncryptedCharField, EncryptedTextField, EncryptedDateField, EncryptedEmailField etc.
# Make sure 'cryptography' is in INSTALLED_APPS and FERNET_KEYS is set in settings.py

from users.models import UserRole # CustomUser is implicitly used via settings.AUTH_USER_MODEL

class Gender(models.TextChoices):
    MALE = 'MALE', _('Male')
    FEMALE = 'FEMALE', _('Female')
    OTHER = 'OTHER', _('Other')
    PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY', _('Prefer not to say')

class Patient(models.Model):
    """
    Patient profile model.
    Sensitive fields like address, phone_number, emergency_contact_name,
    and emergency_contact_phone should be encrypted.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='patient_profile',
        limit_choices_to={'role': UserRole.PATIENT},
        verbose_name=_("User Account")
    )
    date_of_birth = models.DateField( # Consider EncryptedDateField if DOB is highly sensitive
        null=True, blank=True,
        verbose_name=_("Date of Birth")
    )
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        blank=True,
        verbose_name=_("Gender")
    )
    # address = EncryptedTextField(blank=True, verbose_name=_("Address")) # MODIFIED: Was models.TextField
    address = models.TextField(blank=True, verbose_name=_("Address")) # Placeholder: Replace with EncryptedTextField
    # phone_number = EncryptedCharField(max_length=30, blank=True, verbose_name=_("Phone Number")) # MODIFIED: Was models.CharField
    phone_number = models.CharField(max_length=30, blank=True, verbose_name=_("Phone Number")) # Placeholder: Replace with EncryptedCharField
    # emergency_contact_name = EncryptedCharField(max_length=255, blank=True, verbose_name=_("Emergency Contact Name")) # MODIFIED: Was models.CharField
    emergency_contact_name = models.CharField(max_length=255, blank=True, verbose_name=_("Emergency Contact Name")) # Placeholder: Replace with EncryptedCharField
    # emergency_contact_phone = EncryptedCharField(max_length=30, blank=True, verbose_name=_("Emergency Contact Phone")) # MODIFIED: Was models.CharField
    emergency_contact_phone = models.CharField(max_length=30, blank=True, verbose_name=_("Emergency Contact Phone")) # Placeholder: Replace with EncryptedCharField

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Profile Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Profile Updated At"))

    class Meta:
        verbose_name = _("Patient Profile")
        verbose_name_plural = _("Patient Profiles")
        ordering = ['user__last_name', 'user__first_name']

    def __str__(self):
        return f"Patient Profile: {self.user.full_name_display if self.user else self.pk}"

    @property
    def age(self):
        """
        Calculates the age of the patient based on their date of birth.
        Returns None if date_of_birth is not set.
        """
        if not self.date_of_birth:
            return None
        today = timezone.now().date()
        return today.year - self.date_of_birth.year - \
               ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
    age.fget.short_description = _("Age")

    def clean(self):
        super().clean()
        if self.date_of_birth and self.date_of_birth > timezone.now().date():
            raise ValidationError({'date_of_birth': _("Date of birth cannot be in the future.")})

class MedicalRecord(models.Model):
    """
    Medical record for a patient.
    Sensitive fields like diagnosis, symptoms, treatment_plan, and notes
    should be encrypted.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='medical_records',
        verbose_name=_("Patient")
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_medical_records',
        limit_choices_to={'role__in': [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]},
        verbose_name=_("Created By (Staff)")
    )
    record_date = models.DateTimeField( # Consider EncryptedDateTimeField if highly sensitive
        default=timezone.now,
        verbose_name=_("Record Date and Time"),
        db_index=True
    )
    # diagnosis = EncryptedTextField(blank=True, verbose_name=_("Diagnosis")) # MODIFIED: Was models.TextField
    diagnosis = models.TextField(blank=True, verbose_name=_("Diagnosis")) # Placeholder: Replace with EncryptedTextField
    # symptoms = EncryptedTextField(blank=True, verbose_name=_("Symptoms")) # MODIFIED: Was models.TextField
    symptoms = models.TextField(blank=True, verbose_name=_("Symptoms")) # Placeholder: Replace with EncryptedTextField
    # treatment_plan = EncryptedTextField(blank=True, verbose_name=_("Treatment Plan")) # MODIFIED: Was models.TextField
    treatment_plan = models.TextField(blank=True, verbose_name=_("Treatment Plan")) # Placeholder: Replace with EncryptedTextField
    # notes = EncryptedTextField(blank=True, verbose_name=_("Additional Notes (Medical Record)")) # MODIFIED: Was models.TextField
    notes = models.TextField(blank=True, verbose_name=_("Additional Notes (Medical Record)")) # Placeholder: Replace with EncryptedTextField

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Entry Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Entry Updated At"))

    class Meta:
        verbose_name = _("Medical Record")
        verbose_name_plural = _("Medical Records")
        ordering = ['-record_date', '-created_at'] # Order by record_date first, then by creation time
        indexes = [
            models.Index(fields=['patient', '-record_date']),
            models.Index(fields=['created_by', 'record_date']),
        ]

    def __str__(self):
        patient_name = self.patient.user.full_name_display if self.patient and self.patient.user else _("N/A")
        return f"Medical Record for {patient_name} on {self.record_date.strftime('%Y-%m-%d %H:%M')}"

    def clean(self):
        super().clean()
        if self.record_date and self.record_date > timezone.now():
            raise ValidationError({'record_date': _("Record date and time cannot be in the future.")})
        if not self.diagnosis and not self.symptoms and not self.treatment_plan and not self.notes:
            raise ValidationError(_("A medical record entry must contain at least one of: diagnosis, symptoms, treatment plan, or notes."))

