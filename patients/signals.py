# patients/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings # To get AUTH_USER_MODEL string
from django.contrib.auth import get_user_model # To get the actual User model

from .models import Patient # The model to be created/updated
from users.models import UserRole # To check the role of the CustomUser

# from audit_log.models import AuditLogAction, create_audit_log_entry # For logging profile creation
# from audit_log.utils import get_client_ip, get_user_agent
# from audit_log.middleware import get_current_request

CustomUserModel = get_user_model()

@receiver(post_save, sender=CustomUserModel)
def create_or_update_patient_profile_on_user_save(sender, instance, created, **kwargs):
    """
    Signal handler to automatically create or update a Patient profile
    when a CustomUser instance with the PATIENT role is saved.
    """
    if instance.role == UserRole.PATIENT:
        # Use get_or_create to handle both creation of new Patient profiles
        # and ensuring existing ones are correctly linked (though user is PK, so update isn't typical here).
        profile, profile_created = Patient.objects.get_or_create(user=instance)

        if profile_created:
            # Optional: Log the creation of the patient profile if not covered by generic audit.
            # This might be useful if AUDITED_MODELS_CRUD in audit_log.signals
            # doesn't include 'patients.Patient' or if more specific logging is desired.
            # current_request = get_current_request()
            # create_audit_log_entry(
            #     user=getattr(current_request, 'user', None), # User performing action, if available
            #     action=AuditLogAction.PATIENT_PROFILE_CREATED, # Ensure this action exists
            #     target_object=profile,
            #     details=f"Patient profile automatically created for user {instance.email}.",
            #     ip_address=get_client_ip(current_request) if current_request else None,
            #     user_agent=get_user_agent(current_request) if current_request else None,
            # )
            pass # Logging is handled by generic model audit log if Patient is in AUDITED_MODELS_CRUD

# Note: If a user's role changes from PATIENT to something else, this signal
# does not automatically delete the Patient profile. Deletion logic, if needed,
# would require a pre_save signal to check for role changes or a custom management command.
# Typically, OneToOne related objects (like Patient profile) are deleted via cascade
# if the CustomUser is deleted.
