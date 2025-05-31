# hms_django_backend/settings.py
from pathlib import Path
import os
from django.utils.translation import gettext_lazy as _
# from cryptography.fernet import Fernet # Removed as per user request

# --- Core Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = BASE_DIR / 'logs'
if not LOGS_DIR.exists():
    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        # Log this failure if a logging system is already configured,
        # or print a warning during startup.
        print(f"Warning: Could not create logs directory {LOGS_DIR}.")

# --- Security ---
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-development-fallback-key-!change-me!')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS_STRING = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STRING.split(',') if host.strip()]
if DEBUG and '*' not in ALLOWED_HOSTS: # For convenience in local dev with Docker etc.
    ALLOWED_HOSTS.append('*')


# --- Application Definition ---
INSTALLED_APPS = [
    # HMS Core Apps (Order can matter for templates/static files if overridden)
    'users.apps.UsersConfig',
    'patients.apps.PatientsConfig',
    'appointments.apps.AppointmentsConfig',
    'medical_management.apps.MedicalManagementConfig',
    'billing.apps.BillingConfig',
    'telemedicine.apps.TelemedicineConfig',
    'admin_dashboard.apps.AdminDashboardConfig',
    'inquiries.apps.InquiriesConfig',
    'audit_log.apps.AuditLogConfig',

    # Django Contrib Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-Party Apps
    'rest_framework',
    'rest_framework.authtoken',
    'drf_yasg', # For API documentation
    'django_filters', # Added for DRF filtering backend
    # 'fernet_fields', # Removed as per user request (cryptography related)
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware', # For language detection
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit_log.middleware.AuditLogMiddleware',
]

ROOT_URLCONF = 'hms_django_backend.urls'
WSGI_APPLICATION = 'hms_django_backend.wsgi.application' # For WSGI deployments
ASGI_APPLICATION = 'hms_django_backend.asgi.application' # For ASGI deployments

# --- Templates ---
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n', # For language switching in templates
            ],
        },
    },
]

# --- Database ---
# https://docs.djangoproject.com/en/stable/ref/settings/#databases
DB_ENGINE = os.environ.get('DB_ENGINE', 'django.db.backends.mysql')
DB_NAME = os.environ.get('DB_NAME', 'hms_db_dev')
DB_USER = os.environ.get('DB_USER', 'hms_user_dev')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'hms_password_dev')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '3306')

DATABASES = {
    'default': {
        'ENGINE': DB_ENGINE,
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
        'TEST': { # Separate settings for test database if needed
            'NAME': os.environ.get('TEST_DB_NAME', f'test_{DB_NAME}'),
        },
    }
}
# Use SQLite for faster tests if preferred and no MySQL-specific features are tested
# if os.environ.get('USE_SQLITE_FOR_TESTS', 'False') == 'True':
#     DATABASES['default']['TEST']['ENGINE'] = 'django.db.backends.sqlite3'
#     DATABASES['default']['TEST']['NAME'] = BASE_DIR / 'test_db.sqlite3'


# --- Authentication ---
AUTH_USER_MODEL = 'users.CustomUser'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 10}}, # Increased min_length
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LOGIN_URL = '/admin/login/' # Or a custom login URL for DRF views
LOGOUT_REDIRECT_URL = '/' # Where to redirect after logout

# --- Internationalization & Localization ---
# https://docs.djangoproject.com/en/stable/topics/i18n/
LANGUAGE_CODE = os.environ.get('DJANGO_LANGUAGE_CODE', 'en-us')
TIME_ZONE = os.environ.get('DJANGO_TIME_ZONE', 'Africa/Johannesburg')
USE_I18N = True
USE_L10N = True # Controls localized formatting of numbers and dates (deprecated in Django 5.0, USE_I18N handles it)
USE_TZ = True # Store datetimes in UTC in the database.

# Example for providing translation files
# LOCALE_PATHS = [BASE_DIR / 'locale']

# --- Static files (CSS, JavaScript, Images) ---
# https://docs.djangoproject.com/en/stable/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # For collectstatic in production
STATICFILES_DIRS = [BASE_DIR / 'static'] # For development static files not tied to an app

# --- Media files (User-uploaded content) ---
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

# --- Default primary key field type ---
# https://docs.djangoproject.com/en/stable/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        # 'rest_framework.authentication.SessionAuthentication', # If using browsable API with login
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20, # Default items per page
    'DEFAULT_FILTER_BACKENDS': [ # Enable filtering by default
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour', # Adjusted rates
        'user': '1000/hour',
        'login_attempts': '10/minute',
        'register_attempts': '20/hour',
        'inquiry_creation': '30/hour',
        # Add other custom scopes as needed
    },
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.openapi.AutoSchema',
    'TEST_REQUEST_DEFAULT_FORMAT': 'json', # Ensure tests use JSON by default
}

# --- Fernet Fields (Cryptography) ---
# FERNET_KEYS = [] # Removed as per user request
# DJANGO_CRYPTOGRAPHY_KEY = os.environ.get('DJANGO_CRYPTOGRAPHY_KEY') # Removed
# if not DJANGO_CRYPTOGRAPHY_KEY:
#     if DEBUG:
#         print("WARNING: DJANGO_CRYPTOGRAPHY_KEY not set. Field encryption will NOT work.")
#         # DJANGO_CRYPTOGRAPHY_KEY = Fernet.generate_key().decode() # Cannot generate if Fernet is not imported
#     else:
#         raise ValueError("DJANGO_CRYPTOGRAPHY_KEY environment variable not set. This is required for production if using fernet_fields.")
# if DJANGO_CRYPTOGRAPHY_KEY: # Only append if key exists
#    FERNET_KEYS.append(DJANGO_CRYPTOGRAPHY_KEY) # Removed

# --- Email Configuration ---
EMAIL_BACKEND = os.environ.get('DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('DJANGO_EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('DJANGO_EMAIL_PORT', 25))
EMAIL_USE_TLS = os.environ.get('DJANGO_EMAIL_USE_TLS', 'False') == 'True'
EMAIL_USE_SSL = os.environ.get('DJANGO_EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.environ.get('DJANGO_EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('DJANGO_EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DJANGO_DEFAULT_FROM_EMAIL', 'noreply@hms.example.com')
SERVER_EMAIL = os.environ.get('DJANGO_SERVER_EMAIL', DEFAULT_FROM_EMAIL) # For error emails

ADMINS_STRING = os.environ.get('DJANGO_ADMINS', '') # Format: "Name1 <email1@example.com>,Name2 <email2@example.com>"
ADMINS = []
if ADMINS_STRING:
    try:
        ADMINS = [tuple(admin.strip().rsplit(' <', 1)) for admin in ADMINS_STRING.split(',') if '<' in admin and '>' in admin]
        ADMINS = [(name, email[:-1]) for name, email in ADMINS] # Remove trailing '>'
    except Exception:
        print(f"Warning: Could not parse DJANGO_ADMINS: {ADMINS_STRING}")


MANAGERS = ADMINS # For simplicity, managers are the same as admins

# --- Logging Configuration ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{asctime}] {levelname} {module}.{funcName}: {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file_general': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'hms_general.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'file_debug': { # Separate debug log if needed
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'hms_debug.log',
            'maxBytes': 1024 * 1024 * 10,
            'backupCount': 3,
            'formatter': 'verbose',
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True,
        }
    },
    'root': {
        'handlers': ['console', 'file_general'] + (['mail_admins'] if not DEBUG and ADMINS else []),
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file_general'] + (['mail_admins'] if not DEBUG and ADMINS else []),
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.request': { # Specific logger for request errors
            'handlers': ['mail_admins', 'file_general'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Configure loggers for your apps as needed
        'users': {'handlers': ['console', 'file_debug' if DEBUG else 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'patients': {'handlers': ['console', 'file_debug' if DEBUG else 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        # ... other app loggers
        'audit_log': {'handlers': ['console', 'file_general'], 'level': 'INFO', 'propagate': False}, # Audit log might be verbose for debug
    }
}
if DEBUG: # Add debug file handler to root in debug mode for more comprehensive debug logging
    LOGGING['root']['handlers'].append('file_debug')
    LOGGING['root']['level'] = 'DEBUG'


# --- drf-yasg (Swagger/ReDoc) ---
SWAGGER_SETTINGS = {
   'SECURITY_DEFINITIONS': {
      'Token': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': "Token-based authentication. Use 'Token <your_token_here>'."
      }
   },
   'USE_SESSION_AUTH': False, # We primarily use TokenAuthentication
   # 'LOGIN_URL': reverse_lazy('admin:login'), # If using Django admin login for Swagger
   # 'LOGOUT_URL': reverse_lazy('admin:logout'),
   'DEFAULT_INFO': 'hms_django_backend.urls.api_info', # Point to API info in urls.py
   'PERSIST_AUTH': True, # Persist authorization data after refresh
   'REFETCH_SCHEMA_WITH_AUTH': True, # Refetch schema when auth changes
}
REDOC_SETTINGS = {
   'LAZY_RENDERING': False,
   'SPEC_URL_NAME': 'schema-json-yaml' # Point to the JSON/YAML schema endpoint
}

# --- CORS Configuration (if frontend is on a different domain) ---
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000", # Example: React frontend
#     "http://127.0.0.1:3000",
# ]
# CORS_ALLOW_CREDENTIALS = True # If you need to send cookies/auth headers
# Or, for more permissive local development:
# if DEBUG:
#     CORS_ALLOW_ALL_ORIGINS = True

# --- Celery Configuration (if using background tasks) ---
# CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
# CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
# CELERY_ACCEPT_CONTENT = ['json']
# CELERY_TASK_SERIALIZER = 'json'
# CELERY_RESULT_SERIALIZER = 'json'
# CELERY_TIMEZONE = TIME_ZONE
