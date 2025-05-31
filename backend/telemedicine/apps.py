from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class TelemedicineConfig(AppConfig):
    """
    AppConfig for the telemedicine application.
    This class is used by Django to configure the application,
    such as setting its name and default auto field for models.
    The ready() method is the standard place to import any application signals.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'telemedicine'
    verbose_name = _("Telemedicine Services") # Human-readable name for the app

    def ready(self):
        """
        This method is called when Django starts.
        It's a good place to import signals or perform other app initialization
        specific to the telemedicine application.
        """
        try:
            # If you have signals defined in this app (e.g., for creating
            # a telemedicine session when a TELEMEDICINE appointment is made,
            # or for sending notifications), import them here.
            import telemedicine.signals # noqa
        except ImportError:
            # This allows the app to load even if signals.py doesn't exist or has an import error.
            # In a production environment, an ImportError here might indicate a setup issue.
            pass
