from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class AppointmentsConfig(AppConfig):
    """
    AppConfig for the appointments application.
    This configuration class is automatically discovered by Django.
    It defines settings for the appointments app, such as its name,
    the default auto field for its models, and a human-readable verbose name.
    The ready() method is the standard place to import any application signals.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'appointments'
    verbose_name = _("Appointment Scheduling") # Human-readable name for the app

    def ready(self):
        """
        Called when the application is ready.
        This is the ideal place to import signals specific to this app,
        ensuring they are connected when Django initializes.
        """
        try:
            # Import signals if they exist within this application.
            # The import itself is often enough to register the signal handlers.
            import appointments.signals # noqa
        except ImportError:
            # Gracefully handle cases where signals.py might not exist or
            # encounters an issue during import. For a production app,
            # an ImportError here might warrant investigation.
            pass
