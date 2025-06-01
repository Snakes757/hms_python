# apps/core/management/commands/makemigrationsall.py

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings  # Not strictly needed here but often useful
from django.apps import apps as django_apps
from django.core.exceptions import AppRegistryNotReady


class Command(BaseCommand):
    """
    Custom management command to run 'makemigrations <app_label>' for each explicitly defined project app.
    """
    help = "Runs 'makemigrations <app_label>' for each explicitly defined project app."

    # Updated list of app labels based on your project's settings.py
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
    ]

    def add_arguments(self, parser):
        """
        Adds command-line arguments.
        Standard 'makemigrations' options are supported and will be applied to each app.
        """
        parser.add_argument(
            '--name', '-n',
            help='Use this name for migration file(s) created for any app during this run.',
        )
        parser.add_argument(
            '--empty',
            action='store_true',
            help='Create an empty migration for each project app.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Just show what migrations would be made for each app; don't actually write them.",
        )
        parser.add_argument(
            '--merge',
            action='store_true',
            help="Enable fixing of migration conflicts for each app.",
        )
        parser.add_argument(
            '--no-header',
            action='store_true',
            dest='no_header',
            help="Do not add Django version and timestamp header to migration files.",
        )
        parser.add_argument(
            '--check',
            action='store_true',
            dest='check_changes',
            help="Exit with a non-zero status if model changes are detected in any app.",
        )
        # Add other relevant arguments from the original makemigrations command if needed.

    def handle(self, *args, **options):
        """
        The actual logic of the command.
        It iterates through the predefined project app labels and calls 'makemigrations <app_label>' for each.
        """
        self.stdout.write(self.style.SUCCESS(
            "Starting 'makemigrations' for each defined project app..."
        ))

        cmd_options = {}
        if options.get('name'):
            cmd_options['name'] = options.get('name')
        if options.get('empty'):
            cmd_options['empty'] = True
            self.stdout.write(self.style.WARNING(
                "Note: --empty flag is active. An empty migration will be attempted for each project app."
            ))
        if options.get('dry_run'):
            cmd_options['dry_run'] = True
        if options.get('merge'):
            cmd_options['merge'] = True
        if options.get('no_header'):
            cmd_options['no_header'] = True
        if options.get('check_changes'):
            cmd_options['check'] = True  # Django's makemigrations uses 'check'

        if not self.PROJECT_APP_LABELS:
            self.stdout.write(self.style.WARNING(
                "No project app labels defined in the command. Nothing to process."))
            return

        self.stdout.write(self.style.NOTICE(
            f"Project apps to process: {', '.join(self.PROJECT_APP_LABELS)}"
        ))

        overall_success = True
        apps_with_errors = []

        # Verify that all listed apps are actually loaded by Django
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
                f"\nProcessing app: {app_label}"))
            try:
                call_command('makemigrations', app_label, **cmd_options)
                self.stdout.write(self.style.SUCCESS(
                    f"Successfully processed 'makemigrations' for {app_label}."))
            except Exception as e:
                self.stderr.write(self.style.ERROR(
                    f"Error during 'makemigrations' for {app_label}: {e}"))
                overall_success = False
                apps_with_errors.append(app_label)

        if overall_success:
            self.stdout.write(self.style.SUCCESS(
                "\nMakemigrations process completed for all defined project apps."
            ))
        else:
            self.stderr.write(self.style.ERROR(
                f"\nMakemigrations process completed with errors for app(s): {', '.join(apps_with_errors)}."
            ))

        if options.get('check_changes') and not overall_success:
            # If --check is used and there were errors (which implies changes or issues),
            # Django's `check` option in `call_command` should handle the exit code.
            # This is just a summary message.
            self.stderr.write(self.style.ERROR(
                "Changes were detected or errors occurred during --check mode."))
