from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

from .models import Appointment, AppointmentStatus
from audit_log.models import AuditLogAction, create_audit_log_entry
from audit_log.utils import get_client_ip, get_user_agent # Ensure these utilities handle None request gracefully
from audit_log.middleware import get_current_request

@receiver(post_save, sender=Appointment)
def appointment_post_save_handler(sender, instance, created, update_fields=None, **kwargs):

    current_request = get_current_request()
    # Correctly call utilities; they should handle if current_request is None
    ip_address = get_client_ip(current_request)
    user_agent = get_user_agent(current_request) # This will return '' if request is None

    user = None
    if current_request and hasattr(current_request, 'user') and current_request.user.is_authenticated:
        user = current_request.user
    elif hasattr(instance, 'scheduled_by') and instance.scheduled_by and instance.scheduled_by.is_authenticated:
        user = instance.scheduled_by
    # Fallback for user if still None (e.g., system action, or if created_by/updated_by fields exist on instance)
    # If instance has a 'created_by' or 'updated_by' field that might be relevant, consider using it here.
    # For appointments, 'scheduled_by' is a good candidate. If that's None, and no request user,
    # 'user' will remain None, which is acceptable for system-triggered audit logs.

    action = AuditLogAction.APPOINTMENT_SCHEDULED if created else AuditLogAction.APPOINTMENT_UPDATED
    status_changed = False

    if created:
        details = _("Appointment (ID: %(id)s) for %(patient_name)s with Dr. %(doctor_name)s scheduled for %(datetime)s.") % {
            'id': instance.id,
            'patient_name': instance.patient.user.full_name_display if instance.patient and instance.patient.user else _("N/A"),
            'doctor_name': instance.doctor.full_name_display if instance.doctor else _("N/A"),
            'datetime': instance.appointment_date_time.strftime('%Y-%m-%d %H:%M') if instance.appointment_date_time else _("N/A")
        }
    else:
        status_changed = 'status' in (update_fields or [])

        if status_changed:
            if instance.status == AppointmentStatus.CANCELLED_BY_PATIENT or \
               instance.status == AppointmentStatus.CANCELLED_BY_STAFF:
                action = AuditLogAction.APPOINTMENT_CANCELLED
            elif instance.status == AppointmentStatus.COMPLETED:
                action = AuditLogAction.APPOINTMENT_COMPLETED
            elif instance.status == AppointmentStatus.RESCHEDULED:
                action = AuditLogAction.APPOINTMENT_RESCHEDULED
            # Add other specific actions if needed for other status changes

        details = _("Appointment (ID: %(id)s) for %(patient_name)s updated. Status: %(status)s.") % {
            'id': instance.id,
            'patient_name': instance.patient.user.full_name_display if instance.patient and instance.patient.user else _("N/A"),
            'status': instance.get_status_display()
        }

    create_audit_log_entry(
        user=user, # Can be None if no authenticated user context
        action=action,
        target_object=instance,
        details=details,
        ip_address=ip_address, # Can be None
        user_agent=user_agent, # Should be '' if no request, not None
        additional_info={
            'appointment_id': instance.id,
            'patient_id': instance.patient.user.id if instance.patient and instance.patient.user else None,
            'doctor_id': instance.doctor.id if instance.doctor else None,
            'new_status': instance.status if status_changed or created else None,
            'changed_fields': list(update_fields) if update_fields and not created else None
        }
    )

@receiver(pre_save, sender=Appointment)
def appointment_pre_save_handler(sender, instance, **kwargs):
    """
    Handles pre-save operations for appointments.
    For example, if an appointment is rescheduled, this could ensure the
    original appointment's status is appropriately updated.
    """
    if instance.original_appointment and instance.pk is None: # This is a new appointment that reschedules an old one
        # Logic to handle the original_appointment (e.g., mark as RESCHEDULED)
        # This is often better handled in the serializer or view that creates the new appointment.
        # For example, after the new appointment is successfully created, update the old one.
        pass

    # Ensure estimated_duration_minutes is positive
    if instance.estimated_duration_minutes is not None and instance.estimated_duration_minutes <= 0:
        instance.estimated_duration_minutes = Appointment._meta.get_field('estimated_duration_minutes').default # Reset to default
