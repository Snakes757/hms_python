# audit_log/models.py
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

class AuditLogAction(models.TextChoices):
    """
    Defines the set of actions that can be logged in the audit trail.
    This provides a standardized vocabulary for logged events.
    """
    # Generic CRUD
    CREATED = 'CREATED', _('Created Record')
    UPDATED = 'UPDATED', _('Updated Record')
    DELETED = 'DELETED', _('Deleted Record')
    VIEWED = 'VIEWED', _('Viewed Record') # For detailed view logging if implemented

    # User Authentication & Management
    LOGIN_SUCCESS = 'LOGIN_SUCCESS', _('Login Successful')
    LOGIN_FAILED = 'LOGIN_FAILED', _('Login Failed')
    LOGOUT = 'LOGOUT', _('Logout')
    PASSWORD_CHANGED = 'PASSWORD_CHANGED', _('Password Changed')
    PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED', _('Password Reset Requested')
    PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED', _('Password Reset Completed')
    USER_REGISTERED = 'USER_REGISTERED', _('User Registered')
    USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED', _('User Profile Updated by Self')
    ADMIN_USER_UPDATED = 'ADMIN_USER_UPDATED', _('User Profile Updated by Admin')
    ADMIN_USER_DELETED = 'ADMIN_USER_DELETED', _('User Account Deleted by Admin')

    # Appointments
    APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED', _('Appointment Scheduled')
    APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED', _('Appointment Updated')
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED', _('Appointment Cancelled')
    APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED', _('Appointment Marked Completed')
    APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED', _('Appointment Rescheduled')

    # Billing
    INVOICE_GENERATED = 'INVOICE_GENERATED', _('Invoice Generated')
    INVOICE_SENT = 'INVOICE_SENT', _('Invoice Sent')
    INVOICE_UPDATED = 'INVOICE_UPDATED', _('Invoice Updated')
    INVOICE_VOIDED = 'INVOICE_VOIDED', _('Invoice Voided')
    PAYMENT_RECORDED = 'PAYMENT_RECORDED', _('Payment Recorded')
    PAYMENT_UPDATED = 'PAYMENT_UPDATED', _('Payment Updated')
    PAYMENT_DELETED = 'PAYMENT_DELETED', _('Payment Deleted')

    # Medical Management (Prescriptions, Treatments, Observations)
    PRESCRIPTION_ISSUED = 'PRESCRIPTION_ISSUED', _('Prescription Issued')
    PRESCRIPTION_UPDATED = 'PRESCRIPTION_UPDATED', _('Prescription Updated')
    PRESCRIPTION_DELETED = 'PRESCRIPTION_DELETED', _('Prescription Deleted')
    TREATMENT_RECORDED = 'TREATMENT_RECORDED', _('Treatment Recorded')
    TREATMENT_UPDATED = 'TREATMENT_UPDATED', _('Treatment Updated')
    TREATMENT_DELETED = 'TREATMENT_DELETED', _('Treatment Deleted')
    OBSERVATION_LOGGED = 'OBSERVATION_LOGGED', _('Observation Logged')
    OBSERVATION_UPDATED = 'OBSERVATION_UPDATED', _('Observation Updated')
    OBSERVATION_DELETED = 'OBSERVATION_DELETED', _('Observation Deleted')

    # Patient & Medical Record Specific
    PATIENT_PROFILE_CREATED = 'PATIENT_PROFILE_CREATED', _('Patient Profile Created')
    PATIENT_PROFILE_UPDATED = 'PATIENT_PROFILE_UPDATED', _('Patient Profile Updated') # This is covered by USER_PROFILE_UPDATED if patient updates self, or ADMIN_USER_UPDATED by admin.
    MEDICAL_RECORD_CREATED = 'MEDICAL_RECORD_CREATED', _('Medical Record Created')
    MEDICAL_RECORD_UPDATED = 'MEDICAL_RECORD_UPDATED', _('Medical Record Updated')
    MEDICAL_RECORD_DELETED = 'MEDICAL_RECORD_DELETED', _('Medical Record Deleted')

    # Telemedicine
    TELEMED_SESSION_CREATED = 'TELEMED_SESSION_CREATED', _('Telemedicine Session Created')
    TELEMED_SESSION_UPDATED = 'TELEMED_SESSION_UPDATED', _('Telemedicine Session Updated')
    TELEMED_SESSION_CANCELLED = 'TELEMED_SESSION_CANCELLED', _('Telemedicine Session Cancelled')
    TELEMED_SESSION_COMPLETED = 'TELEMED_SESSION_COMPLETED', _('Telemedicine Session Completed')
    TELEMED_SESSION_DELETED = 'TELEMED_SESSION_DELETED', _('Telemedicine Session Deleted')

    # Inquiries
    INQUIRY_SUBMITTED = 'INQUIRY_SUBMITTED', _('Inquiry Submitted')
    INQUIRY_UPDATED = 'INQUIRY_UPDATED', _('Inquiry Updated')
    INQUIRY_CLOSED = 'INQUIRY_CLOSED', _('Inquiry Closed')
    INQUIRY_DELETED = 'INQUIRY_DELETED', _('Inquiry Deleted by Admin')

    # General/System
    ADMIN_ACTION = 'ADMIN_ACTION', _('Admin General Action')
    SYSTEM_EVENT = 'SYSTEM_EVENT', _('System Event')

class AuditLogEntry(models.Model):
    """
    Represents a single entry in the audit log.
    Records user actions, system events, and changes to data.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name=_("User"),
        help_text=_("The user who performed the action. Null for system actions.")
    )
    action = models.CharField(
        max_length=50,
        choices=AuditLogAction.choices,
        verbose_name=_("Action Performed"),
        db_index=True
    )
    timestamp = models.DateTimeField(
        default=timezone.now,
        verbose_name=_("Timestamp"),
        db_index=True
    )
    details = models.TextField(
        blank=True,
        verbose_name=_("Details"),
        help_text=_("A human-readable description of the action and its context.")
    )
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, verbose_name=_("IP Address"),
        help_text=_("The IP address from which the action was performed.")
    )
    user_agent = models.TextField(
        blank=True, verbose_name=_("User Agent"),
        help_text=_("The User-Agent string of the client.")
    )
    # Generic relation to link to any model instance
    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL, # Keep log if model type is deleted (rare)
        null=True, blank=True,
        verbose_name=_("Target Model Type")
    )
    target_object_id = models.CharField( # Changed to CharField for flexibility with non-integer PKs if ever needed
        max_length=255, null=True, blank=True, verbose_name=_("Target Object ID")
    )
    target_object = GenericForeignKey('target_content_type', 'target_object_id')

    target_object_repr = models.CharField(
        max_length=255, blank=True,
        verbose_name=_("Target Object Representation"),
        help_text=_("String representation of the target object at the time of logging (e.g., if deleted).")
    )
    additional_info = models.JSONField(
        null=True, blank=True, verbose_name=_("Additional Information"),
        help_text=_("A JSON field to store any extra structured data related to the audit log entry.")
    )

    class Meta:
        verbose_name = _("Audit Log Entry")
        verbose_name_plural = _("Audit Log Entries")
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['target_content_type', 'target_object_id'], name='auditlog_target_idx'),
            models.Index(fields=['user', 'action'], name='auditlog_user_action_idx'),
            # timestamp is already indexed due to ordering and date_hierarchy in admin
        ]

    def __str__(self):
        user_email = self.user.email if self.user else _("System/Anonymous")
        action_display = self.get_action_display()
        target_repr = self.target_object_repr or (f"{self.target_content_type.model if self.target_content_type else ''} ID: {self.target_object_id}" if self.target_object_id else _("N/A"))
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')} - {user_email} - {action_display} - Target: {target_repr}"

def create_audit_log_entry(
    user,
    action: AuditLogAction,
    target_object=None,
    details: str = "",
    ip_address: str = None,
    user_agent: str = None,
    additional_info: dict = None,
    target_content_type: ContentType = None,
    target_object_id = None, # Allow str or int
    target_object_repr: str = None
):
    """
    Helper function to create an AuditLogEntry.
    Simplifies the process of logging actions throughout the application.
    """
    log_entry_data = {
        'user': user,
        'action': action.value if isinstance(action, AuditLogAction) else str(action),
        'details': details,
        'ip_address': ip_address,
        'user_agent': user_agent,
        'additional_info': additional_info or {}, # Ensure it's a dict, not None
    }

    if target_object:
        log_entry_data['target_content_type'] = ContentType.objects.get_for_model(target_object)
        log_entry_data['target_object_id'] = str(target_object.pk) # Ensure PK is string
        log_entry_data['target_object_repr'] = str(target_object)[:255]
    elif target_content_type and target_object_id:
        log_entry_data['target_content_type'] = target_content_type
        log_entry_data['target_object_id'] = str(target_object_id) # Ensure ID is string
        log_entry_data['target_object_repr'] = target_object_repr[:255] if target_object_repr else f"{target_content_type.model} ID: {target_object_id}"
    
    AuditLogEntry.objects.create(**log_entry_data)
