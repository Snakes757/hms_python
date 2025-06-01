# admin_dashboard/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class AdminDashboardConfig(AppConfig):
    """
    AppConfig for the admin_dashboard application.
    Sets the default auto field, application name, and verbose name.
    It also attempts to import signals for the application upon readiness.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_dashboard'
    verbose_name = _("Hospital Administration Dashboard")

    def ready(self):
        """
        Called when the application is ready.
        Attempts to import signals; passes if ImportError occurs.
        """
        try:
            import admin_dashboard.signals # noqa: F401
        except ImportError:
            # If signals.py does not exist or cannot be imported, proceed without it.
            pass
