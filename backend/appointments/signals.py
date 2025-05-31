# appointments/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

from .models import Appointment, AppointmentStatus
from audit_log.models import AuditLogAction, create_audit_log_entry
from audit_log.utils import get_client_ip, get_user_agent
from audit_log.middleware import get_current_request

@receiver(post_save, sender=Appointment)
def appointment_post_save_handler(sender, instance, created, update_fields, **kwargs):
    """
    Handles audit logging after an Appointment instance is saved.
    """
    current_request = get_current_request()
    ip_address = get_client_ip(current_request) if current_request else None
    user_agent = get_user_agent(current_request) if current_request else None
    # Determine the user performing the action
    user = getattr(current_request, 'user', None) if current_request and hasattr(current_request, 'user') and current_request.user.is_authenticated else instance.scheduled_by

    if created:
        action = AuditLogAction.APPOINTMENT_SCHEDULED
        details = _("Appointment (ID: %(id)s) for %(patient_name)s with Dr. %(doctor_name)s scheduled for %(datetime)s.") % {
            'id': instance.id,
            'patient_name': instance.patient.user.full_name,
            'doctor_name': instance.doctor.full_name if instance.doctor else _("N/A"),
            'datetime': instance.appointment_date_time.strftime('%Y-%m-%d %H:%M')
        }
    else:
        action = AuditLogAction.APPOINTMENT_UPDATED # Default to updated
        # Check if status was part of the update_fields (if provided)
        status_changed = 'status' in (update_fields or [])
        
        if status_changed:
            if instance.status == AppointmentStatus.CANCELLED_BY_PATIENT or instance.status == AppointmentStatus.CANCELLED_BY_STAFF:
                action = AuditLogAction.APPOINTMENT_CANCELLED
            elif instance.status == AppointmentStatus.COMPLETED:
                action = AuditLogAction.APPOINTMENT_COMPLETED
            elif instance.status == AppointmentStatus.RESCHEDULED: # This appointment itself is now the old one
                action = AuditLogAction.APPOINTMENT_RESCHEDULED
        
        details = _("Appointment (ID: %(id)s) for %(patient_name)s updated. Status: %(status)s.") % {
            'id': instance.id,
            'patient_name': instance.patient.user.full_name,
            'status': instance.get_status_display()
        }

    create_audit_log_entry(
        user=user,
        action=action,
        target_object=instance,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        additional_info={
            'appointment_id': instance.id,
            'patient_id': instance.patient.user.id,
            'doctor_id': instance.doctor.id if instance.doctor else None,
            'new_status': instance.status if status_changed or created else None,
            'changed_fields': list(update_fields) if update_fields and not created else None
        }
    )

@receiver(pre_save, sender=Appointment)
def appointment_pre_save_handler(sender, instance, **kwargs):
    """
    Handles logic before an Appointment instance is saved.
    For example, if an appointment is being rescheduled (i.e., `original_appointment` is set),
    the original appointment's status might need to be updated.
    However, this is often better handled in the serializer or view where the context of
    creating a *new* rescheduled appointment is clearer.
    """
    if instance.original_appointment and instance.pk is None: # This is a new appointment that reschedules an old one
        # The logic to update original_appointment.status to RESCHEDULED
        # is now primarily in AppointmentSerializer.create for clarity and atomicity.
        pass

    # Ensure estimated_duration_minutes is positive
    if instance.estimated_duration_minutes is not None and instance.estimated_duration_minutes <= 0:
        instance.estimated_duration_minutes = Appointment._meta.get_field('estimated_duration_minutes').default # Reset to default
