# users/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class UsersConfig(AppConfig):
    """
    AppConfig for the users application.
    Sets the default auto field, application name, and verbose name.
    It also imports signals for the application upon readiness, which is crucial
    for auto-creating role-specific profiles and Patient profiles.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
    verbose_name = _("User Management and Profiles")

    def ready(self):
        """
        Called when the application is ready.
        Imports signals to ensure they are connected. This is important for
        creating role-specific profiles (DoctorProfile, NurseProfile, etc.)
        and Patient profiles when a CustomUser is saved.
        """
        try:
            import users.signals  # noqa: F401
            # The Patient profile creation signal is in patients.signals,
            # which should be imported by patients.apps.PatientsConfig.ready()
        except ImportError:
            # Log this or raise a warning if signals are critical and not found.
            # For profile creation, this is important.
            # Consider: import logging; logging.warning("User signals not loaded.")
            pass
