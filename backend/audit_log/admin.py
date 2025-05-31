# audit_log/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html
import json # For pretty printing JSON in additional_info

from .models import AuditLogEntry, AuditLogAction

@admin.register(AuditLogEntry)
class AuditLogEntryAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the AuditLogEntry model.
    Provides a read-only interface for viewing audit trail records.
    """
    list_display = (
        'timestamp',
        'user_display',
        'action_display',
        'target_object_link',
        'ip_address',
        'details_summary',
    )
    list_filter = ('action', 'timestamp', ('user', admin.RelatedOnlyFieldListFilter), 'target_content_type')
    search_fields = (
        'user__email__icontains',
        'user__username__icontains',
        'details__icontains',
        'ip_address__icontains',
        'target_object_repr__icontains',
        'user_agent__icontains'
    )
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'

    # Define fields to be displayed in the detail view (all read-only)
    fields = (
        'timestamp',
        'user_display', # Custom method for display
        'action_display', # Custom method for display
        'details',
        'ip_address',
        'user_agent',
        'target_object_link', # Custom method for link
        'target_object_repr',
        'additional_info_pretty', # Custom method for pretty JSON
    )
    # Make all fields read-only
    readonly_fields = fields # Effectively makes the entire form read-only

    def user_display(self, obj):
        if obj.user:
            try:
                link = reverse("admin:users_customuser_change", args=[obj.user.id])
                return format_html('<a href="{}">{} ({})</a>', link, obj.user.full_name, obj.user.email)
            except Exception: # Fallback if user URL cannot be reversed (e.g., user deleted)
                return obj.user.email or obj.user.username # Show email or username
        return _("System/Anonymous")
    user_display.short_description = _('User')
    user_display.admin_order_field = 'user__email'

    def action_display(self, obj):
        return obj.get_action_display() # Uses the model's choice display method
    action_display.short_description = _('Action')
    action_display.admin_order_field = 'action'

    def target_object_link(self, obj):
        if obj.target_object: # If the target object still exists
            try:
                admin_url_name = f'admin:{obj.target_content_type.app_label}_{obj.target_content_type.model}_change'
                admin_url = reverse(admin_url_name, args=[obj.target_object_id])
                return format_html('<a href="{}">{} (ID: {})</a>', admin_url, obj.target_object_repr or str(obj.target_object), obj.target_object_id)
            except Exception: # Catch NoReverseMatch or other errors
                # Fallback if URL cannot be built (e.g., model not registered in admin or different ID type)
                return obj.target_object_repr or f"{obj.target_content_type.model if obj.target_content_type else 'N/A'} (ID: {obj.target_object_id or 'N/A'})"
        elif obj.target_object_repr: # Show stored representation if object is deleted
            return f"{obj.target_object_repr} (Deleted)"
        elif obj.target_content_type and obj.target_object_id: # If only CT and ID exist
             return f"{obj.target_content_type.model.title()} ID: {obj.target_object_id} (Deleted)"
        return _("N/A")
    target_object_link.short_description = _('Target Object')

    def details_summary(self, obj):
        if obj.details:
            return (obj.details[:75] + '...') if len(obj.details) > 75 else obj.details
        return _("N/A")
    details_summary.short_description = _('Details Summary')

    def additional_info_pretty(self, obj):
        if obj.additional_info:
            try:
                # Convert to JSON string with indentation for readability
                pretty_json = json.dumps(obj.additional_info, indent=4, sort_keys=True, ensure_ascii=False)
                return format_html("<pre style='white-space: pre-wrap; word-wrap: break-word;'>{}</pre>", pretty_json)
            except TypeError: # Fallback if not JSON serializable (should not happen with JSONField)
                return str(obj.additional_info)
        return _("N/A")
    additional_info_pretty.short_description = _('Additional Info')

    def has_add_permission(self, request):
        # Audit logs should be created by the system, not manually in admin.
        return False

    def has_change_permission(self, request, obj=None):
        # Audit logs should be immutable.
        return False

    def has_delete_permission(self, request, obj=None):
        # Audit logs should generally not be deleted from the admin interface.
        # Deletion should be a controlled, rare operation if ever needed.
        return False # Set to True if admin deletion is desired, but be cautious.

    def get_queryset(self, request):
        # Optimize query by prefetching related user and content type
        return super().get_queryset(request).select_related('user', 'target_content_type')

