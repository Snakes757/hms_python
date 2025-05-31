# medical_management/signals.py
from django.db.models.signals import post_save # pre_delete can also be used if needed
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

# from .models import Prescription, Treatment, Observation # Models are senders
# from audit_log.models import AuditLogAction, create_audit_log_entry
# from audit_log.utils import get_client_ip, get_user_agent
# from audit_log.middleware import get_current_request

# Audit logging for Prescription, Treatment, Observation is handled by the generic
# model audit signals in audit_log.signals.py, as these models
# are (or should be) listed in AUDITED_MODELS_CRUD.

# If specific, more detailed logging or other side effects are needed for
# medical_management models beyond simple CRUD auditing, custom signal handlers
# can be defined here.

# Example: If creating a Prescription should trigger a notification or another action.
# @receiver(post_save, sender=Prescription)
# def prescription_created_or_updated(sender, instance, created, **kwargs):
#     if created:
#         # Logic for when a new prescription is created
#         # e.g., send a notification to the pharmacy or patient (if integrated)
#         print(f"New prescription created: {instance.medication_name} for {instance.patient}")
#
#         # Detailed audit logging (if generic one is not sufficient)
#         # current_request = get_current_request()
#         # user = getattr(current_request, 'user', instance.prescribed_by) # Best guess for user
#         # create_audit_log_entry(
#         #     user=user,
#         #     action=AuditLogAction.PRESCRIPTION_ISSUED, # Assuming this specific action exists
#         #     target_object=instance,
#         #     details=f"Prescription for '{instance.medication_name}' issued to patient {instance.patient.user.full_name}.",
#         #     ip_address=get_client_ip(current_request) if current_request else None,
#         #     user_agent=get_user_agent(current_request) if current_request else None,
#         # )
#     else:
#         # Logic for when an existing prescription is updated
#         # print(f"Prescription updated: {instance.medication_name}")
#         pass

# This file is kept minimal if generic audit logging covers the needs.
# Ensure Prescription, Treatment, Observation are in audit_log.signals.AUDITED_MODELS_CRUD.
