# audit_log/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class AuditLogConfig(AppConfig):
    """
    AppConfig for the audit_log application.
    Sets the default auto field, application name, and verbose name.
    It also attempts to import signals for the application upon readiness,
    though this app primarily defines signals rather than consuming them locally.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'audit_log'
    verbose_name = _("Audit Logging")

    def ready(self):
        """
        Called when the application is ready.
        This is a good place to import signals if this app itself had models
        that needed to trigger actions based on other apps' signals, or if
        it needed to register its own signal receivers that are defined elsewhere.
        Currently, audit_log.signals registers receivers for common Django signals
        and model signals from other apps.
        """
        try:
            # Import signals to ensure they are connected when the app is ready.
            import audit_log.signals # noqa: F401
        except ImportError:
            # Gracefully pass if signals.py has an issue or doesn't exist,
            # though it's critical for this app's functionality.
            pass
