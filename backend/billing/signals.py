# billing/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

from .models import InvoiceItem, Payment # Invoice model is updated, not a sender here
from audit_log.models import AuditLogAction, create_audit_log_entry
from audit_log.utils import get_client_ip, get_user_agent
from audit_log.middleware import get_current_request, get_current_user


@receiver(post_save, sender=InvoiceItem)
@receiver(post_delete, sender=InvoiceItem)
def update_invoice_on_item_change(sender, instance, **kwargs):
    """
    Signal handler to update the parent Invoice's totals and status
    whenever an InvoiceItem is saved or deleted.
    """
    if instance.invoice: # Ensure invoice exists
        instance.invoice.update_invoice_totals_and_status(force_save=True)


@receiver(post_save, sender=Payment)
@receiver(post_delete, sender=Payment)
def update_invoice_on_payment_change(sender, instance, **kwargs):
    """
    Signal handler to update the parent Invoice's paid amount and status
    whenever a Payment is saved or deleted.
    """
    if instance.invoice: # Ensure invoice exists
        instance.invoice.update_invoice_totals_and_status(force_save=True)


# Audit logging for Invoice, InvoiceItem, Payment is handled by the generic
# model audit signals in audit_log.signals.py, as these models
# are listed in AUDITED_MODELS_CRUD.

# If more specific logging for billing events is needed beyond simple CRUD,
# custom signal handlers can be added here. For example:

# @receiver(post_save, sender=Invoice)
# def log_invoice_status_change(sender, instance, created, update_fields, **kwargs):
#     if not created and update_fields and 'status' in update_fields:
#         current_request = get_current_request()
#         user = get_current_user() # Or instance.created_by if appropriate context
#         ip_address = get_client_ip(current_request) if current_request else None
#         user_agent = get_user_agent(current_request) if current_request else None
        
#         action = AuditLogAction.INVOICE_UPDATED # Or a more specific status change action
#         details = _("Invoice %(invoice_number)s status changed to %(status)s.") % {
#             'invoice_number': instance.invoice_number,
#             'status': instance.get_status_display()
#         }
#         if instance.status == InvoiceStatus.SENT:
#             action = AuditLogAction.INVOICE_SENT
#         elif instance.status == InvoiceStatus.VOID:
#             action = AuditLogAction.INVOICE_VOIDED
        
#         create_audit_log_entry(
#             user=user,
#             action=action,
#             target_object=instance,
#             details=details,
#             ip_address=ip_address,
#             user_agent=user_agent,
#             additional_info={'new_status': instance.status}
#         )
