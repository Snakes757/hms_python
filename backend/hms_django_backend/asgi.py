"""
ASGI config for hms_django_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/stable/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

# Set the DJANGO_SETTINGS_MODULE environment variable to point to your project's settings.
# This is crucial for Django to know which settings to use when the ASGI application is loaded.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hms_django_backend.settings')

# Get the ASGI application instance.
# This callable is what ASGI servers (like Daphne or Uvicorn) will use to interact with your Django application.
application = get_asgi_application()

# If you plan to use Django Channels for WebSockets or other asynchronous protocols,
# you would typically add more configuration here, often involving ProtocolTypeRouter
# and URL routing for those protocols. For a standard HTTP-only Django project,
# get_asgi_application() is sufficient.

# Example for Django Channels (if you were using it):
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
# import my_app.routing # Assuming you have routing defined for channels in an app
#
# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AuthMiddlewareStack(
#         URLRouter(
#             my_app.routing.websocket_urlpatterns
#         )
#     ),
# })
