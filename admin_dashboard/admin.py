from django.contrib import admin
from django.utils.translation import gettext_lazy as _
# from .models import DashboardPreference # Import if you want to register DashboardPreference

# Basic Admin Site Customization
admin.site.site_header = _("Hospital Management System Admin")
admin.site.site_title = _("HMS Admin Portal")
admin.site.index_title = _("Welcome to the HMS Administration Panel")

# Example of registering a model from admin_dashboard/models.py
# If you have models like DashboardPreference and want them in the admin:
# @admin.register(DashboardPreference)
# class DashboardPreferenceAdmin(admin.ModelAdmin):
#     """
#     Admin interface for DashboardPreference model.
#     Allows administrators to manage user-specific dashboard settings.
#     """
#     list_display = ('user', 'default_report_on_load', 'items_per_page_reports', 'dashboard_theme', 'last_updated')
#     search_fields = ('user__username', 'user__email', 'default_report_on_load')
#     list_filter = ('dashboard_theme',)
#     ordering = ('user__username',)
#     readonly_fields = ('last_updated',)
#     fieldsets = (
#         (None, {
#             'fields': ('user',)
#         }),
#         (_("Preference Details"), {
#             'fields': ('default_report_on_load', 'items_per_page_reports', 'dashboard_theme') # Add 'widget_visibility' if used
#         }),
#         (_("Timestamps"), {
#             'fields': ('last_updated',),
#             'classes': ('collapse',)
#         }),
#     )
#     # If user field is a ForeignKey/OneToOneField to CustomUser, autocomplete_fields can be useful
#     autocomplete_fields = ['user']


# If there were other models specific to the admin_dashboard app,
# they would be registered here as well.
# For example, if SystemAnnouncement model was active:
# from .models import SystemAnnouncement
# @admin.register(SystemAnnouncement)
# class SystemAnnouncementAdmin(admin.ModelAdmin):
#     list_display = ('title', 'created_by', 'start_display_time', 'end_display_time', 'is_active', 'created_at')
#     search_fields = ('title', 'content', 'created_by__username')
#     list_filter = ('is_active', 'start_display_time', 'end_display_time')
#     ordering = ('-created_at',)
#     autocomplete_fields = ['created_by']
#     readonly_fields = ('created_at',)
