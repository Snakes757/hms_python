"""
WSGI config for hms_django_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/stable/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

# Set the DJANGO_SETTINGS_MODULE environment variable to point to your project's settings.
# This is crucial for Django to know which settings to use when the WSGI application is loaded.
# Ensure this matches the actual path to your settings file.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hms_django_backend.settings')

# Get the WSGI application instance.
# This callable is what WSGI servers (like Gunicorn, uWSGI) will use to
# interact with your Django application for handling HTTP requests.
application = get_wsgi_application()

# Additional production considerations (often handled by the WSGI server or deployment scripts):
# - Serving static files: In production, Django's development server (runserver) should not be used.
#   Static files are typically collected by `manage.py collectstatic` and served by a dedicated
#   web server (like Nginx or Apache) or a CDN.
# - WSGI server configuration: Parameters like the number of worker processes, threads, timeouts, etc.,
#   are configured at the WSGI server level (e.g., in Gunicorn's configuration file).
# - Environment variables: Ensure all necessary environment variables (SECRET_KEY, database credentials, etc.)
#   are available to the environment where the WSGI server runs.
