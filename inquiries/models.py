# inquiries/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

from patients.models import Patient
from users.models import UserRole # CustomUser is implicitly used via settings.AUTH_USER_MODEL

class InquiryStatus(models.TextChoices):
    OPEN = 'OPEN', _('Open')
    IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
    RESOLVED = 'RESOLVED', _('Resolved')
    CLOSED = 'CLOSED', _('Closed')
    PENDING_PATIENT = 'PENDING_PATIENT', _('Pending Patient Response')
    ON_HOLD = 'ON_HOLD', _('On Hold') # Added status

class InquirySource(models.TextChoices):
    PHONE = 'PHONE', _('Phone Call')
    EMAIL = 'EMAIL', _('Email')
    WALK_IN = 'WALK_IN', _('Walk-In')
    WEB_PORTAL = 'WEB_PORTAL', _('Web Portal Form')
    CHAT = 'CHAT', _('Live Chat')
    REFERRAL = 'REFERRAL', _('Referral') # Added status
    OTHER = 'OTHER', _('Other')

class Inquiry(models.Model):
    """
    Represents an inquiry made by a patient or visitor,
    and tracks its handling and resolution.
    """
    subject = models.CharField(
        max_length=255,
        verbose_name=_("Subject/Reason for Inquiry")
    )
    description = models.TextField(
        verbose_name=_("Detailed Description of Inquiry")
    )
    inquirer_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_("Inquirer's Full Name"),
        help_text=_("Required if not linked to an existing patient or if inquirer is not the patient.")
    )
    inquirer_email = models.EmailField(
        blank=True, null=True,
        verbose_name=_("Inquirer's Email")
    )
    inquirer_phone = models.CharField(
        max_length=30, blank=True,
        verbose_name=_("Inquirer's Phone Number")
    )
    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='inquiries_made',
        verbose_name=_("Associated Patient (if any)"),
        help_text=_("Link to an existing patient if the inquiry is from or about them.")
    )
    source = models.CharField(
        max_length=20,
        choices=InquirySource.choices,
        default=InquirySource.PHONE,
        verbose_name=_("Source of Inquiry")
    )
    status = models.CharField(
        max_length=20,
        choices=InquiryStatus.choices,
        default=InquiryStatus.OPEN,
        verbose_name=_("Inquiry Status"),
        db_index=True
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handled_inquiries',
        limit_choices_to={'role__in': [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.NURSE]},
        verbose_name=_("Handled By (Staff)"),
        help_text=_("Staff member currently handling or who resolved the inquiry.")
    )
    resolution_notes = models.TextField(
        blank=True,
        verbose_name=_("Resolution Notes"),
        help_text=_("Details about how the inquiry was resolved or actions taken.")
    )
    created_at = models.DateTimeField(
        default=timezone.now, # Editable default, not auto_now_add
        verbose_name=_("Inquiry Received At"),
        db_index=True
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last Updated At")
    )

    class Meta:
        verbose_name = _("Inquiry")
        verbose_name_plural = _("Inquiries")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['source', 'created_at']),
            models.Index(fields=['patient', 'created_at']),
            models.Index(fields=['handled_by', 'status']),
        ]

    def __str__(self):
        return f"Inquiry: {self.subject[:60]}... ({self.get_status_display()}) - Rec: {self.created_at.strftime('%Y-%m-%d')}"

    def clean(self):
        super().clean()
        # If a patient is linked, auto-fill inquirer details if they are empty
        if self.patient:
            if not self.inquirer_name:
                self.inquirer_name = self.patient.user.full_name
            if not self.inquirer_email and self.patient.user.email:
                self.inquirer_email = self.patient.user.email
            # Consider adding phone number auto-fill if Patient model has a direct phone field
            # if not self.inquirer_phone and hasattr(self.patient, 'phone_number') and self.patient.phone_number:
            #     self.inquirer_phone = self.patient.phone_number

        # Require some form of contact or patient link
        if not self.patient and not self.inquirer_name and not self.inquirer_email and not self.inquirer_phone:
            raise ValidationError(
                _("An inquiry must have an associated patient or at least one piece of inquirer contact information (name, email, or phone).")
            )
        
        if self.status in [InquiryStatus.RESOLVED, InquiryStatus.CLOSED] and not self.resolution_notes:
            # This validation might be too strict for model level, consider for forms/serializers
            # raise ValidationError({'resolution_notes': _("Resolution notes are required when an inquiry is resolved or closed.")})
            pass

    def save(self, *args, **kwargs):
        # self.full_clean() # Optionally call full_clean before saving, but usually forms handle this.
        super().save(*args, **kwargs)
