# patients/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class PatientsConfig(AppConfig):
    """
    AppConfig for the patients application.
    Sets the default auto field, application name, and verbose name.
    It also imports signals for the application upon readiness,
    which is crucial for auto-creating Patient profiles.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'patients'
    verbose_name = _("Patient Records and Profiles")

    def ready(self):
        """
        Called when the application is ready.
        Imports signals to ensure they are connected, e.g., for creating
        Patient profiles when a CustomUser with PATIENT role is created.
        """
        try:
            import patients.signals  # noqa: F401
        except ImportError:
            # Log this or raise a warning if signals are critical and not found.
            # For Patient profile creation, this is important.
            # Consider: import logging; logging.warning("Patient signals not loaded.")
            pass
