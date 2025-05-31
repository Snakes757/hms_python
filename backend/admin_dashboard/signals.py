# admin_dashboard/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from .models import SomeModelInAdminDashboard # Example if you had models here
from audit_log.models import create_audit_log_entry, AuditLogAction # If logging actions from here

# Example signal receiver (customize as needed)
@receiver(post_save, sender=SomeModelInAdminDashboard)
def log_admin_dashboard_change(sender, instance, created, **kwargs):
    action = AuditLogAction.CREATED if created else AuditLogAction.UPDATED
    # Assuming get_current_user and other necessary context is available or passed
    # create_audit_log_entry(user=None, action=action, target_object=instance, details=f"Admin dashboard item {instance} changed.")
    pass

# Add other signal handlers relevant to the admin_dashboard app below.
# For instance, if specific actions within the admin dashboard need to trigger
# notifications or other side effects, those signals would be defined and connected here.

# print("admin_dashboard signals loaded") # Optional: for debugging signal loading
