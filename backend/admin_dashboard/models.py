from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
# It's good practice to import UserRole if it's used,
# assuming it's defined in 'users.models.UserRole'
# from users.models import UserRole # Uncomment if UserRole is defined and needed

class DashboardPreference(models.Model):
    """
    Stores user-specific preferences for the admin dashboard.
    This model allows administrators to customize their dashboard experience,
    such as setting default report views or display options.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_dashboard_preferences',
        # If UserRole.ADMIN is available and you want to restrict this:
        # limit_choices_to={'role': UserRole.ADMIN}
        # For now, assuming any authenticated user might have preferences,
        # or this can be adjusted based on the exact definition of UserRole.
        # If 'role' is a field on your CustomUser model, ensure 'ADMIN' is a valid choice.
        # Example: limit_choices_to={'role': 'ADMIN'} if role is a CharField.
        help_text=_("The administrator user associated with these dashboard preferences.")
    )
    
    default_report_on_load = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text=_("Identifier for the default report to load on dashboard access (e.g., 'patient_statistics', 'financial_report').")
    )
    
    items_per_page_reports = models.PositiveIntegerField(
        default=10,
        help_text=_("Default number of items to show per page in report tables within the admin dashboard.")
    )
    
    # Example of another preference: theme
    dashboard_theme = models.CharField(
        max_length=50,
        default='default',
        help_text=_("Preferred theme for the admin dashboard (e.g., 'default', 'dark', 'light').")
    )

    # Example of a JSONField to store more complex, unstructured preferences
    # widget_visibility = models.JSONField(
    #     default=dict,
    #     blank=True,
    #     help_text=_("Stores visibility preferences for various dashboard widgets as a JSON object.")
    # )

    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last Updated")
    )

    class Meta:
        verbose_name = _("Admin Dashboard Preference")
        verbose_name_plural = _("Admin Dashboard Preferences")
        ordering = ['user__username']

    def __str__(self):
        """
        String representation of the DashboardPreference instance.
        """
        return f"Dashboard Preferences for {self.user.username}"

# Other potential models for an admin_dashboard could include:
#
# class SystemAnnouncement(models.Model):
#     """
#     Model for creating and managing system-wide announcements displayed on the dashboard.
#     """
#     title = models.CharField(max_length=200, verbose_name=_("Title"))
#     content = models.TextField(verbose_name=_("Content"))
#     created_by = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name='created_announcements',
#         verbose_name=_("Created By")
#     )
#     start_display_time = models.DateTimeField(verbose_name=_("Start Display Time"))
#     end_display_time = models.DateTimeField(verbose_name=_("End Display Time"))
#     is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
#     created_at = models.DateTimeField(auto_now_add=True)
#
#     class Meta:
#         verbose_name = _("System Announcement")
#         verbose_name_plural = _("System Announcements")
#         ordering = ['-created_at']
#
#     def __str__(self):
#         return self.title
#
# Note: The current admin_dashboard/views.py primarily generates reports by querying
# models from other applications. If the dashboard requires its own persistent data
# beyond user preferences (like the SystemAnnouncement example above),
# those models would be defined here.
