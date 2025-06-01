# telemedicine/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import TelemedicineSession, TelemedicineSessionStatus
from appointments.models import Appointment, AppointmentStatus as ApptStatus # Alias to avoid conflict
# from audit_log.models import create_audit_log_entry, AuditLogAction # For audit logging
# from some_notification_service import send_notification # Example notification import

@receiver(post_save, sender=TelemedicineSession)
def telemedicine_session_post_save_handler(sender, instance, created, **kwargs):
    """
    Signal handler for after a TelemedicineSession instance is saved.
    """
    if created:
        # Logic for newly created telemedicine sessions
        # Example: Send notifications to patient and doctor with session details/URL
        # patient_email = instance.patient.user.email
        # doctor_email = instance.doctor.email if instance.doctor else None
        # subject = f"Telemedicine Session Scheduled: {instance.id}"
        # message = f"A telemedicine session has been scheduled for {instance.patient.user.full_name} with Dr. {instance.doctor.full_name if instance.doctor else 'N/A'} " \
        #           f"on {instance.session_start_time.strftime('%Y-%m-%d %H:%M')}. Session URL: {instance.session_url or 'To be provided'}"
        # send_notification(to=[patient_email, doctor_email], subject=subject, message=message)
        pass
    else:
        # Logic for updated telemedicine sessions
        # Example: If status changes to COMPLETED, also update the linked Appointment status
        if 'status' in kwargs.get('update_fields', {}) or not kwargs.get('update_fields'): # Check if status was updated or if all fields updated
            if instance.status == TelemedicineSessionStatus.COMPLETED and instance.appointment:
                if instance.appointment.status != ApptStatus.COMPLETED:
                    instance.appointment.status = ApptStatus.COMPLETED
                    instance.appointment.save(update_fields=['status'])
                    # Log this change or send notification about appointment completion
            
            # Example: If status changes to CANCELLED, notify participants
            # elif instance.status == TelemedicineSessionStatus.CANCELLED:
            #     # send_cancellation_notification(instance)
            #     pass
        pass

@receiver(pre_save, sender=TelemedicineSession)
def telemedicine_session_pre_save_handler(sender, instance, **kwargs):
    """
    Signal handler for before a TelemedicineSession instance is saved.
    Can be used for validation or modifying the instance.
    The model's save() method already handles syncing from appointment if creating.
    """
    # Example: If session_end_time is set and status is moving to COMPLETED,
    # ensure session_end_time is not before session_start_time.
    # This is also handled in serializer validation and model's clean method.
    if instance.session_end_time and instance.session_start_time and \
       instance.session_end_time < instance.session_start_time:
        # This should ideally be caught earlier, but as a failsafe:
        instance.session_end_time = instance.session_start_time # Or prevent save by raising error
        pass
    
    # If the session is being created from an appointment and details are missing,
    # they are auto-filled in the model's save() method.
    pass


# Add other signal handlers relevant to the telemedicine app below.
# For example:
# - Sending reminders before a telemedicine session.
# - Notifying staff if a session fails or a participant doesn't show up.
# - Triggering post-session workflows (e.g., creating follow-up tasks).

# print("telemedicine signals loaded") # Optional: for debugging signal loading
