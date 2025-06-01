# apps/core/management/commands/migrateall.py

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings  # Not strictly needed here but often useful
from django.apps import apps as django_apps
from django.core.exceptions import AppRegistryNotReady


class Command(BaseCommand):
    """
    Custom management command to run 'migrate <app_label>' for each explicitly defined project app.
    Can also run 'migrate' without arguments to migrate all apps if PROJECT_APP_LABELS is empty or commented out.
    """
    help = "Runs 'migrate <app_label>' for each explicitly defined project app, or 'migrate' for all apps."

    # Updated list of app labels based on your project's settings.py
    # If you want to migrate ALL apps (including Django's own and third-party),
    # comment out or empty this list. The script will then call 'migrate' without app labels.
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
        # Add any other custom app labels here if they have models and need migrations
        # It's generally recommended to migrate built-in apps (like auth, admin, contenttypes)
        # with the main `python manage.py migrate` command without specifying app labels,
        # unless you have a very specific reason to control their migration order here.
        # For safety, this script will primarily focus on your custom apps if this list is populated.
    ]

    def add_arguments(self, parser):
        """
        Adds command-line arguments.
        Standard 'migrate' options are supported and will be applied to each app or globally.
        """
        parser.add_argument(
            '--database',
            default=None,
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
            dest='check_migrations',
            help="Exits with a non-zero status if unapplied migrations are detected (per app or globally).",
        )
        # Add other relevant arguments from the original migrate command if needed.

    def handle(self, *args, **options):
        """
        The actual logic of the command.
        It iterates through project apps and calls 'migrate <app_label>' for each,
        or calls 'migrate' globally if PROJECT_APP_LABELS is empty.
        """
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
        if options.get('check_migrations'):
            cmd_options['check'] = True  # Django's migrate uses 'check'

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
            "Starting 'migrate' for each defined project app..."
        ))
        self.stdout.write(self.style.NOTICE(
            f"Project apps to process: {', '.join(self.PROJECT_APP_LABELS)}"
        ))

        overall_success = True
        apps_with_errors = []

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
                    f"Skipping app '{app_label}': Not found in loaded Django apps. Check INSTALLED_APPS and app configuration."))
                continue

            self.stdout.write(self.style.MIGRATE_HEADING(
                f"\nProcessing migrations for app: {app_label}"))
            try:
                call_command('migrate', app_label, **cmd_options)
                self.stdout.write(self.style.SUCCESS(
                    f"Successfully processed migrations for {app_label}."))
            except Exception as e:
                self.stderr.write(self.style.ERROR(
                    f"Error during 'migrate' for {app_label}: {e}"))
                overall_success = False
                apps_with_errors.append(app_label)

        if overall_success:
            self.stdout.write(self.style.SUCCESS(
                "\nMigration process completed for all defined project apps."
            ))
        else:
            self.stderr.write(self.style.ERROR(
                f"\nMigration process completed with errors for app(s): {', '.join(apps_with_errors)}."
            ))

        if options.get('check_migrations') and not overall_success:
            self.stderr.write(self.style.ERROR(
                "Unapplied migrations were detected or errors occurred during --check mode."))
