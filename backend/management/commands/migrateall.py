from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings  # Not strictly needed here but often useful
from django.apps import apps as django_apps
from django.core.exceptions import AppRegistryNotReady

class Command(BaseCommand):
    """
    Runs 'migrate <app_label>' for each explicitly defined project app
    relevant to the Hospital Management System (HMS), or 'migrate' for all apps
    if PROJECT_APP_LABELS is empty.
    """
    help = "Runs 'migrate <app_label>' for each HMS project app or all apps."

    # Updated list of app labels relevant to the HMS
    PROJECT_APP_LABELS = [
        'users',
        'patients',
        'appointments',
        'medical_management',
        'billing',
        'telemedicine',
        'admin_dashboard',
        'inquiries',
        'audit_log',
        # Add any other custom HMS apps here if they have models and need migrations
    ]

    def add_arguments(self, parser):
        """
        Adds command-line arguments for the migrateall command.
        """
        parser.add_argument(
            '--database',
            default=None, # Django's migrate command defaults to 'default'
            help='Nominates a database to synchronize. Defaults to the "default" database.',
        )
        parser.add_argument(
            '--fake',
            action='store_true',
            help='Mark migrations as run without actually running them (per app or globally).',
        )
        parser.add_argument(
            '--fake-initial',
            action='store_true',
            help='Detect if tables already exist and fake-apply initial migrations if so (per app or globally). '
                 'Requires a connection to the database.',
        )
        parser.add_argument(
            '--plan',
            action='store_true',
            help="Shows a list of issues Django expects to fix (per app or globally) but doesn't run the "
                 "SQL itself.",
        )
        parser.add_argument(
            '--run-syncdb',
            action='store_true',
            help='Creates tables for apps without migrations (will apply per app or globally).',
        )
        parser.add_argument(
            '--check',
            action='store_true',
            dest='check_migrations', # Use a different dest to avoid conflict with built-in check
            help="Exits with a non-zero status if unapplied migrations are detected (per app or globally).",
        )
        # It's good practice not to redefine arguments that 'migrate' itself uses,
        # unless you are explicitly overriding their behavior.
        # 'app_label' and 'migration_name' are positional arguments for 'migrate'.
        # This command iterates app_labels, so we don't add 'app_label' here.

    def handle(self, *args, **options):
        """
        Handles the execution of the migrateall command.
        It iterates through the defined HMS project apps and runs 'migrate' for each,
        or runs 'migrate' for all apps if PROJECT_APP_LABELS is empty.
        """
        # Prepare options for the call_command
        cmd_options = {}
        if options.get('database'):
            cmd_options['database'] = options.get('database')
        if options.get('fake'):
            cmd_options['fake'] = True
        if options.get('fake_initial'):
            cmd_options['fake_initial'] = True
        if options.get('plan'):
            cmd_options['plan'] = True
        if options.get('run_syncdb'):
            cmd_options['run_syncdb'] = True
        if options.get('check_migrations'): # Use the dest name
            cmd_options['check'] = True # Django's migrate uses 'check'

        if not self.PROJECT_APP_LABELS:
            self.stdout.write(self.style.SUCCESS(
                "PROJECT_APP_LABELS is empty. Running 'migrate' for all apps..."
            ))
            try:
                call_command('migrate', **cmd_options)
                self.stdout.write(self.style.SUCCESS(
                    "Successfully processed 'migrate' for all apps."
                ))
            except Exception as e:
                self.stderr.write(self.style.ERROR(
                    f"Error during global 'migrate': {e}"
                ))
            return

        self.stdout.write(self.style.SUCCESS(
            "Starting 'migrate' for each defined HMS project app..."
        ))
        self.stdout.write(self.style.NOTICE(
            f"HMS project apps to process: {', '.join(self.PROJECT_APP_LABELS)}"
        ))

        overall_success = True
        apps_with_errors = []

        # Verify that defined apps are actually loaded by Django
        loaded_app_labels = set()
        try:
            for app_config in django_apps.get_app_configs():
                loaded_app_labels.add(app_config.label)
        except AppRegistryNotReady:
            self.stderr.write(self.style.ERROR(
                "Django app registry is not ready. Cannot verify app labels."))
            return

        for app_label in self.PROJECT_APP_LABELS:
            if app_label not in loaded_app_labels:
                self.stdout.write(self.style.WARNING(
                    f"Skipping app '{app_label}': Not found in loaded Django apps. "
                    "Check INSTALLED_APPS and app configuration."
                ))
                continue

            self.stdout.write(self.style.MIGRATE_HEADING(
                f"\nProcessing migrations for app: {app_label}"
            ))
            try:
                # Call the 'migrate' command for the current app_label
                call_command('migrate', app_label, **cmd_options)
                self.stdout.write(self.style.SUCCESS(
                    f"Successfully processed migrations for {app_label}."))
            except Exception as e:
                self.stderr.write(self.style.ERROR(
                    f"Error during 'migrate' for {app_label}: {e}"
                ))
                overall_success = False
                apps_with_errors.append(app_label)

        if overall_success:
            self.stdout.write(self.style.SUCCESS(
                "\nMigration process completed for all defined HMS project apps."
            ))
        else:
            self.stderr.write(self.style.ERROR(
                f"\nMigration process completed with errors for app(s): {', '.join(apps_with_errors)}."
            ))

        if options.get('check_migrations') and not overall_success:
            # Exit with a non-zero status if --check was used and errors occurred
            self.stderr.write(self.style.ERROR(
                "Unapplied migrations were detected or errors occurred during --check mode."
            ))
            # Similar to makemigrationsall, Django's 'migrate --check' handles its own exit code.
            # If overall_success is False, it implies an error in our script execution.
            # Consider sys.exit(1) for strict error handling of the overall script.
