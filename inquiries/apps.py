# inquiries/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class InquiriesConfig(AppConfig):
    """
    AppConfig for the inquiries application.
    Sets the default auto field, application name, and verbose name.
    It also attempts to import signals if any are defined for this app.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inquiries'
    verbose_name = _("Inquiries Management")

    def ready(self):
        """
        Called when the application is ready.
        Currently, no signals are explicitly imported here, but this is where
        app-specific signal connections would typically be made if defined
        within a 'signals.py' file in this app.
        """
        try:
            # import inquiries.signals # noqa: F401 # Uncomment if you create signals.py
            pass
        except ImportError:
            pass
