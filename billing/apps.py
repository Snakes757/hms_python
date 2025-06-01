# billing/apps.py
from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class BillingConfig(AppConfig):
    """
    AppConfig for the billing application.
    Sets the default auto field, application name, and verbose name.
    It also attempts to import signals for the application upon readiness,
    which is crucial for this app's logic (e.g., updating invoice totals).
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'billing'
    verbose_name = _("Billing and Invoicing")

    def ready(self):
        """
        Called when the application is ready.
        Attempts to import signals to ensure they are connected.
        """
        try:
            import billing.signals # noqa: F401
        except ImportError:
            # Log this or raise a warning if signals are critical and not found
            # For now, pass silently as per original structure.
            # Consider: import logging; logging.warning("Billing signals not loaded.")
            pass
