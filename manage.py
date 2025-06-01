#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # Set the default Django settings module for the 'manage.py' command-line utility.
    # It's crucial that 'hms_django_backend.settings' correctly points to your project's settings file.
    # Based on your structure, 'hms_django_backend' is the directory containing 'settings.py'.
    os.environ.setdefault('DJANGO_SETTINGS_MODULE',
                          'hms_django_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
