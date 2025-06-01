from datetime import timedelta
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver # Decorator to connect functions to signals
from django.db.models.signals import post_save, pre_delete # Using pre_delete to capture state before deletion
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType # For generic relations

from .models import AuditLogEntry, AuditLogAction, create_audit_log_entry # Core audit log model and helper
from .utils import get_client_ip, get_user_agent # Utility functions to get request metadata
from .middleware import get_current_request, get_current_user # Access request/user via middleware

UserModel = get_user_model()

# --- User Authentication Audit Signals ---

@receiver(user_logged_in)
def audit_user_logged_in_signal(sender, request, user, **kwargs):
    """
    Signal receiver for successful user logins.
    Creates an audit log entry when a user logs in.
    A small time window check is added to prevent duplicate logs from rapid signal firing.
    """
    # Check if a similar log entry was created very recently to avoid duplicates
    if not AuditLogEntry.objects.filter(
        user=user, 
        action=AuditLogAction.LOGIN_SUCCESS, 
        timestamp__gte=timezone.now() - timedelta(seconds=5) # 5-second window
    ).exists():
        create_audit_log_entry(
            user=user,
            action=AuditLogAction.LOGIN_SUCCESS,
            ip_address=get_client_ip(request), # Get IP from the request object passed by the signal
            user_agent=get_user_agent(request),# Get User-Agent from request
            details=f"User {user.email} logged in successfully."
        )

@receiver(user_logged_out)
def audit_user_logged_out_signal(sender, request, user, **kwargs):
    """
    Signal receiver for user logouts.
    Creates an audit log entry when a user logs out.
    Checks if user exists as request.user might be AnonymousUser if session expired.
    """
    if user and user.is_authenticated: # Ensure user is valid and was authenticated
        if not AuditLogEntry.objects.filter(
            user=user, 
            action=AuditLogAction.LOGOUT, 
            timestamp__gte=timezone.now() - timedelta(seconds=5)
        ).exists():
            create_audit_log_entry(
                user=user,
                action=AuditLogAction.LOGOUT,
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request),
                details=f"User {user.email} logged out."
            )

@receiver(user_login_failed)
def audit_user_login_failed_signal(sender, credentials, request, **kwargs):
    """
    Signal receiver for failed login attempts.
    Creates an audit log entry detailing the failed attempt.
    'credentials' dict usually contains 'username' or 'email'.
    """
    email_attempted = credentials.get('email') or credentials.get('username') or 'Unknown user (credentials not provided)'
    # Check for recent similar failed attempts to avoid log flooding from brute-force attacks
    if not AuditLogEntry.objects.filter(
        action=AuditLogAction.LOGIN_FAILED,
        details__icontains=f"Login attempt failed for: {email_attempted}", # Approximate check
        timestamp__gte=timezone.now() - timedelta(seconds=10) # Wider window for failed attempts
    ).exists():
        create_audit_log_entry(
            user=None, # No authenticated user for a failed login
            action=AuditLogAction.LOGIN_FAILED,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            details=f"Login attempt failed for: {email_attempted}.",
            additional_info={'credentials_provided': {'email': credentials.get('email')}} # Log only relevant parts
        )

# --- Model Change Audit Signals ---

# Define which models should be audited for create, update, delete actions.
# Format: 'app_label.ModelName'
AUDITED_MODELS_CRUD = [
    'users.CustomUser',
    'patients.Patient', 
    'patients.MedicalRecord',
    'appointments.Appointment',
    'medical_management.Prescription', 
    'medical_management.Treatment', 
    'medical_management.Observation',
    'billing.Invoice', 
    'billing.Payment',
    'inquiries.Inquiry', # Assuming this is the correct model name from inquiries app
    'telemedicine.TelemedicineSession', # Assuming this is the correct model name
    # Add other models as needed
]

def get_model_instance_repr(instance):
    """
    Generates a string representation for a model instance, useful for audit logs.
    Includes model name, instance string representation, and primary key.
    """
    if not instance:
        return "N/A"
    return f"{instance._meta.verbose_name.title()} '{str(instance)}' (ID: {instance.pk})"

@receiver(post_save)
def audit_model_post_save_signal(sender, instance, created, **kwargs):
    """
    Signal receiver for post_save events on specified models.
    Logs CREATED or UPDATED actions.
    Relies on AuditLogMiddleware to get the current user.
    """
    model_path = f"{sender._meta.app_label}.{sender._meta.object_name}"
    if model_path in AUDITED_MODELS_CRUD and not isinstance(instance, AuditLogEntry):
        action = AuditLogAction.CREATED if created else AuditLogAction.UPDATED
        details = f"{get_model_instance_repr(instance)} was {action.label.lower()}."

        current_user = get_current_user() # Get user from middleware
        current_request = get_current_request()
        ip_address = get_client_ip(current_request)
        user_agent = get_user_agent(current_request)

        # Fallback for user if not available from request (e.g., in management commands)
        # This part might need careful consideration based on how models are updated.
        if not current_user:
            if hasattr(instance, 'updated_by') and getattr(instance, 'updated_by'):
                current_user = getattr(instance, 'updated_by')
            elif hasattr(instance, 'created_by') and getattr(instance, 'created_by'):
                current_user = getattr(instance, 'created_by')
            elif hasattr(instance, 'user') and isinstance(getattr(instance, 'user'), UserModel): # e.g. Patient.user
                 current_user = getattr(instance, 'user')
        
        # Avoid logging AuditLogEntry creations/updates to prevent recursion
        if isinstance(instance, AuditLogEntry):
            return

        create_audit_log_entry(
            user=current_user,
            action=action,
            target_object=instance, # Pass the instance itself
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
            # 'changed_fields' could be added here if tracking field-level changes,
            # but that requires more complex logic (e.g., comparing old and new values).
        )

@receiver(pre_delete) # Use pre_delete to access instance data before it's gone
def audit_model_pre_delete_signal(sender, instance, **kwargs):
    """
    Signal receiver for pre_delete events on specified models.
    Logs DELETED actions. The instance still exists at this point.
    """
    model_path = f"{sender._meta.app_label}.{sender._meta.object_name}"
    if model_path in AUDITED_MODELS_CRUD and not isinstance(instance, AuditLogEntry):
        details = f"{get_model_instance_repr(instance)} is about to be deleted."
        
        current_user = get_current_user()
        current_request = get_current_request()
        ip_address = get_client_ip(current_request)
        user_agent = get_user_agent(current_request)

        if isinstance(instance, AuditLogEntry): # Should not happen if not in AUDITED_MODELS_CRUD
            return

        # For deleted objects, target_object_repr and target_content_type/object_id are more robust
        # as the instance will be gone after this signal.
        target_content_type = ContentType.objects.get_for_model(instance)
        target_object_id = instance.pk
        target_object_repr = get_model_instance_repr(instance)


        create_audit_log_entry(
            user=current_user,
            action=AuditLogAction.DELETED,
            target_content_type=target_content_type,
            target_object_id=target_object_id,
            target_object_repr=target_object_repr, # Store representation
            details=f"{target_object_repr} was deleted.", # Update details
            ip_address=ip_address,
            user_agent=user_agent
        )

# Ensure the AuditLogConfig in apps.py imports these signals:
# In audit_log/apps.py:
# class AuditLogConfig(AppConfig):
#     # ...
#     def ready(self):
#         import audit_log.signals # noqa
