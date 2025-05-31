# hms_django_backend/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView # For serving a simple index or API root view

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# API Documentation Info (can be imported by settings.SWAGGER_SETTINGS)
api_info = openapi.Info(
    title="Hospital Management System API",
    default_version='v1.0',
    description="API for the Hospital Management System (HMS), facilitating patient management, "
                "appointments, medical records, billing, and administrative operations.",
    terms_of_service="https://www.example.com/policies/terms/", # Replace with actual URL
    contact=openapi.Contact(email="hms-api-support@example.com"), # Replace
    license=openapi.License(name="MIT License"), # Replace with your project's license
)

SchemaView = get_schema_view(
   api_info,
   public=True, # Set to False if API docs should be private/require auth
   permission_classes=(permissions.AllowAny,), # Or IsAdminUser for restricted access
)

urlpatterns = [
    # Django Admin Site
    path('admin/', admin.site.urls),

    # API Endpoints (versioned under 'api/v1/')
    path('api/v1/users/', include('users.urls', namespace='users-v1')),
    path('api/v1/patients/', include('patients.urls', namespace='patients-v1')),
    path('api/v1/appointments/', include('appointments.urls', namespace='appointments-v1')),
    path('api/v1/medical/', include('medical_management.urls', namespace='medical_management-v1')),
    path('api/v1/billing/', include('billing.urls', namespace='billing-v1')),
    path('api/v1/telemedicine/', include('telemedicine.urls', namespace='telemedicine-v1')),
    path('api/v1/inquiries/', include('inquiries.urls', namespace='inquiries-v1')),
    path('api/v1/dashboard/', include('admin_dashboard.urls', namespace='admin_dashboard-v1')), # Admin reports

    # API Authentication (if using DRF's built-in token views, typically within users.urls)
    # path('api/v1/auth/', include('rest_framework.urls', namespace='rest_framework')), # For session auth if needed

    # API Documentation (Swagger & ReDoc)
    re_path(r'^api/v1/docs/swagger(?P<format>\.json|\.yaml)$', SchemaView.without_ui(cache_timeout=0), name='schema-json-yaml'),
    path('api/v1/docs/swagger/', SchemaView.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/v1/docs/redoc/', SchemaView.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # Optional: A simple root view for the API
    # path('api/v1/', TemplateView.as_view(template_name='api_root.html'), name='api-root'), # Requires 'api_root.html'
]

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # Optional: Django Debug Toolbar (if installed)
    # if 'debug_toolbar' in settings.INSTALLED_APPS:
    #     import debug_toolbar
    #     urlpatterns = [
    #         path('__debug__/', include(debug_toolbar.urls)),
    #     ] + urlpatterns

# Custom error handlers (optional)
# handler400 = 'your_app.views.custom_bad_request_view'
# handler403 = 'your_app.views.custom_permission_denied_view'
# handler404 = 'your_app.views.custom_page_not_found_view'
# handler500 = 'your_app.views.custom_server_error_view'
