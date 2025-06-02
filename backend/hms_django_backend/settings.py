from pathlib import Path
import os
import environ  # For loading environment variables
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv  # For loading .env file

BASE_DIR = Path(__file__).resolve().parent.parent

env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

env = environ.Env(
    # set casting, default value
    DJANGO_DEBUG=(bool, False), # Default to True for development
    DJANGO_SECRET_KEY=(str, 'django-insecure-development-fallback-key-!change-me-this-is-not-secure!'),
    DJANGO_ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
    DB_ENGINE=(str, 'django.db.backends.postgresql'),
    DB_NAME=(str, 'hms_dev_db'),
    DB_USER=(str, 'hms_user'),
    DB_PASSWORD=(str, 'hms_password'),
    DB_HOST=(str, 'localhost'),
    DB_PORT=(int, 5432),
    TEST_DB_NAME=(str, 'test_hms_dev_db'),
    DJANGO_LANGUAGE_CODE=(str, 'en-us'),
    DJANGO_TIME_ZONE=(str, 'Africa/Johannesburg'),
    DJANGO_EMAIL_BACKEND=(str, 'django.core.mail.backends.console.EmailBackend'),
    DJANGO_EMAIL_HOST=(str, 'localhost'),
    DJANGO_EMAIL_PORT=(int, 25),
    DJANGO_EMAIL_USE_TLS=(bool, False),
    DJANGO_EMAIL_USE_SSL=(bool, False),
    DJANGO_EMAIL_HOST_USER=(str, ''),
    DJANGO_EMAIL_HOST_PASSWORD=(str, ''),
    DJANGO_DEFAULT_FROM_EMAIL=(str, 'webmaster@localhost'),
    DJANGO_SERVER_EMAIL=(str, 'root@localhost'),
    DJANGO_ADMINS=(str, ''), # Format: "Admin Name <admin@example.com>,Another Admin <another@example.com>"
    DJANGO_LOG_LEVEL=(str, 'INFO'),
    DJANGO_LOG_LEVEL_DJANGO=(str, 'INFO'),
    SEED_DEFAULT_PASSWORD=(str, "PasswordHMS123!") # Default password for seeder
)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DJANGO_DEBUG')

ALLOWED_HOSTS = env('DJANGO_ALLOWED_HOSTS')

# Ensure '*' is added to ALLOWED_HOSTS if DEBUG is True and it's not already present
if DEBUG and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')


# Application definition
INSTALLED_APPS = [
    # Custom HMS Apps (ensure they are correctly named and configured)
    'users.apps.UsersConfig',
    'patients.apps.PatientsConfig',
    'appointments.apps.AppointmentsConfig',
    'medical_management.apps.MedicalManagementConfig',
    'billing.apps.BillingConfig',
    'telemedicine.apps.TelemedicineConfig',
    'admin_dashboard.apps.AdminDashboardConfig', # For custom admin dashboard features
    'inquiries.apps.InquiriesConfig',
    'audit_log.apps.AuditLogConfig', # For audit logging

    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',           # Django REST framework for APIs
    'rest_framework.authtoken',  # Token-based authentication for DRF
    'drf_yasg',                 # API documentation (Swagger/ReDoc)
    'django_filters',           # Filtering for DRF
    # Add other third-party apps here if any
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', # For Django admin and session-based auth
    'django.middleware.locale.LocaleMiddleware',      # For internationalization
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware', # For Django's messaging framework
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit_log.middleware.AuditLogMiddleware', # Custom audit log middleware
    # Add django-debug-toolbar middleware if installed and DEBUG is True
    # 'debug_toolbar.middleware.DebugToolbarMiddleware', # Example
]

ROOT_URLCONF = 'hms_django_backend.urls' # Main project URL configuration
WSGI_APPLICATION = 'hms_django_backend.wsgi.application'  # For WSGI deployments
ASGI_APPLICATION = 'hms_django_backend.asgi.application' # For ASGI deployments


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # Project-level templates directory
        'APP_DIRS': True,  # Allow Django to look for templates in app directories
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request', # Required for admin and other features
                'django.contrib.auth.context_processors.auth', # For user object in templates
                'django.contrib.messages.context_processors.messages', # For messages framework
                'django.template.context_processors.i18n',  # For language settings in templates
            ],
        },
    },
]


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE'),
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT'),
        'OPTIONS': {
            # e.g., 'sslmode': 'require' for PostgreSQL SSL
        },
        'TEST': {
            'NAME': env('TEST_DB_NAME'), # Separate test database
        },
    }
}

# Custom User Model
AUTH_USER_MODEL = 'users.CustomUser'  # Specifies the custom user model

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 10}}, # Enforce a minimum password length
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/
LANGUAGE_CODE = env('DJANGO_LANGUAGE_CODE')
TIME_ZONE = env('DJANGO_TIME_ZONE')
USE_I18N = True  # Enable Django's translation system
USE_L10N = True  # Enable formatting dates, numbers, etc., according to current locale (deprecated in Django 5.0, USE_FORMATTING is new)
USE_TZ = True    # Enable timezone-aware datetimes

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # For collectstatic in production
STATICFILES_DIRS = [
    BASE_DIR / 'static',  # Project-wide static files (if any)
]

# Media files (User-uploaded content)
# https://docs.djangoproject.com/en/5.0/topics/files/
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles' # Directory where user-uploaded files will be stored

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',  # For token-based API auth
        'rest_framework.authentication.SessionAuthentication', # For browsable API and session-based auth
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', # Default to requiring authentication
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,  # Default number of items per page
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',  # For field filtering
        'rest_framework.filters.SearchFilter',               # For search functionality
        'rest_framework.filters.OrderingFilter',             # For ordering results
    ],
    'DEFAULT_THROTTLE_CLASSES': [  # For API rate limiting
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {  # Define rates for different scopes
        'anon': '100/hour',  # For anonymous users
        'user': '1000/hour',  # For authenticated users
        'login_attempts': '10/minute',  # Specific scope for login attempts
        'register_attempts': '20/hour',  # Specific scope for registration
        'inquiry_creation': '30/hour',  # Specific scope for inquiry creation
        # Add more custom scopes as needed
    },
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.openapi.AutoSchema', # For drf-yasg
    'TEST_REQUEST_DEFAULT_FORMAT': 'json', # Use JSON for test requests by default
}

# Email settings
EMAIL_BACKEND = env('DJANGO_EMAIL_BACKEND')
EMAIL_HOST = env('DJANGO_EMAIL_HOST')
EMAIL_PORT = env('DJANGO_EMAIL_PORT')
EMAIL_USE_TLS = env('DJANGO_EMAIL_USE_TLS')
EMAIL_USE_SSL = env('DJANGO_EMAIL_USE_SSL')
EMAIL_HOST_USER = env('DJANGO_EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = env('DJANGO_EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = env('DJANGO_DEFAULT_FROM_EMAIL') # Default sender for various automated emails
SERVER_EMAIL = env('DJANGO_SERVER_EMAIL') # Sender for error emails to ADMINS/MANAGERS

# Admins and Managers for error reporting
ADMINS_STRING = env('DJANGO_ADMINS')
ADMINS_TUPLE_LIST = []
if ADMINS_STRING:
    try:
        # Parse "Name <email@example.com>, Another Name <another@example.com>"
        ADMINS_TUPLE_LIST = [
            tuple(admin.strip().rsplit(' <', 1)) for admin in ADMINS_STRING.split(',') if '<' in admin and '>' in admin
        ]
        ADMINS_TUPLE_LIST = [(name, email[:-1]) for name, email in ADMINS_TUPLE_LIST] # Remove trailing '>'
    except Exception as e:
        print(f"Warning: Could not parse DJANGO_ADMINS environment variable: {ADMINS_STRING}. Error: {e}")
ADMINS = ADMINS_TUPLE_LIST
MANAGERS = ADMINS # Typically, managers are the same as admins

# Logging Configuration
LOGS_DIR = BASE_DIR / 'logs'
if not LOGS_DIR.exists():
    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        print(f"Warning: Could not create logs directory {LOGS_DIR}. Logging to file might fail.")

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,  # Keep Django's default loggers active
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',  # Use brace-style formatting
        },
        'simple': {
            'format': '[{asctime}] {levelname} {module}.{funcName}: {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',  # Output to console
            'formatter': 'simple',
            'level': 'DEBUG' if DEBUG else 'INFO', # Show DEBUG in console if DEBUG is True
        },
        'file_general': {  # General application log
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'hms_general.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,  # Number of backup files
            'formatter': 'verbose',
        },
        'file_debug': {  # Detailed debug log (only active if DEBUG is True)
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'hms_debug.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 3,
            'formatter': 'verbose',
        },
        'mail_admins': {  # Send ERROR level logs to ADMINS
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'include_html': True,  # Send HTML emails
            'filters': ['require_debug_false'] if not DEBUG else [], # Only mail admins if not in DEBUG
        }
    },
    'filters': { # Filter to only send emails when DEBUG is False
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        }
    },
    'root': {  # Root logger configuration
        'handlers': ['console', 'file_general'],
        'level': env('DJANGO_LOG_LEVEL'), # Default 'INFO'
    },
    'loggers': {  # Specific logger configurations
        'django': {  # Django's own loggers
            'handlers': ['console', 'file_general'],
            'level': env('DJANGO_LOG_LEVEL_DJANGO', default='INFO'), # Default 'INFO'
            'propagate': False,  # Don't pass to root logger if handled here
        },
        'django.request': {  # For request errors (4XX, 5XX)
            'handlers': ['mail_admins', 'file_general'], # Send to admins and log to file
            'level': 'ERROR', # Log only errors and criticals for requests
            'propagate': False,
        },
        'django.db.backends': { # Specific logger for database queries
            'handlers': ['console', 'file_general'], # Decide if you want SQL in console even with DEBUG=True but level=INFO
            'level': 'INFO',  # << SET TO INFO or WARNING to hide DEBUG SQL from this logger
            'propagate': False,
        },
        # App-specific loggers (can inherit level from root or be set explicitly)
        'users': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False}, # Example
        'patients': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'appointments': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'medical_management': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'billing': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'telemedicine': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'admin_dashboard': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'inquiries': {'handlers': ['console', 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'audit_log': {'handlers': ['console', 'file_general'], 'level': 'INFO', 'propagate': False}, # Audit log might be verbose for DEBUG
    }
}

# If DEBUG is True, ensure debug file handler is added and appropriate loggers are set to DEBUG level
if DEBUG:
    # Add debug file handler to root if not already present
    if 'file_debug' not in LOGGING['root']['handlers']:
        LOGGING['root']['handlers'].append('file_debug')
    LOGGING['root']['level'] = 'DEBUG' # Set root to DEBUG

    # For other loggers, set them to DEBUG, but respect specific settings like for django.db.backends
    for logger_name_key in list(LOGGING['loggers'].keys()): # Iterate over keys to allow modification
        # Add file_debug handler if not present
        if 'file_debug' not in LOGGING['loggers'][logger_name_key]['handlers']:
            LOGGING['loggers'][logger_name_key]['handlers'].append('file_debug')
        
        # Only set to DEBUG if it's not the django.db.backends logger, which we want to keep at INFO
        # or if its current level is already DEBUG (or more verbose).
        # This ensures that if a logger was explicitly set to INFO (like django.db.backends), it stays INFO.
        if logger_name_key != 'django.db.backends':
            LOGGING['loggers'][logger_name_key]['level'] = 'DEBUG'
    
    # Ensure django.db.backends specifically uses its defined level (INFO) even in DEBUG mode for other loggers
    # And ensure it has the file_debug handler if DEBUG is True
    if 'django.db.backends' in LOGGING['loggers']:
        if 'file_debug' not in LOGGING['loggers']['django.db.backends']['handlers']:
             LOGGING['loggers']['django.db.backends']['handlers'].append('file_debug')
        # Its level is already set to INFO above, so we don't override it here.
    else: # This case should ideally not be hit if django.db.backends is defined above
        LOGGING['loggers']['django.db.backends'] = {
            'handlers': ['console', 'file_general', 'file_debug'],
            'level': 'INFO',
            'propagate': False,
        }


# Add mail_admins handler to root and django loggers if ADMINS is set and not in DEBUG mode
if ADMINS and not DEBUG: # Add mail_admins handler if ADMINS is set and not in DEBUG
    if 'mail_admins' not in LOGGING['root']['handlers']:
         LOGGING['root']['handlers'].append('mail_admins')
    if 'mail_admins' not in LOGGING['loggers']['django']['handlers']:
        LOGGING['loggers']['django']['handlers'].append('mail_admins')


# drf-yasg (Swagger/ReDoc) settings
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Token': { # Matches TokenAuthentication
            'type': 'apiKey',
            'name': 'Authorization',  # Header name
            'in': 'header',           # Location of the API key
            'description': "Token-based authentication. Use 'Token <your_token_here>'."
        }
    },
    'USE_SESSION_AUTH': False,  # Disable session auth in Swagger UI if primarily token-based
    'DEFAULT_INFO': 'hms_django_backend.urls.api_info', # Path to your openapi.Info object
    'PERSIST_AUTH': True,  # Persist authorization in Swagger UI across page reloads
    'REFETCH_SCHEMA_WITH_AUTH': True,  # Re-fetch schema when auth changes
    'OPERATIONS_SORTER': 'alpha', # Sort operations alphabetically
    'TAGS_SORTER': 'alpha', # Sort tags alphabetically
    'DEEP_LINKING': True,
}

REDOC_SETTINGS = {
    'LAZY_RENDERING': False,  # Render ReDoc immediately
    'SPEC_URL_NAME': 'schema-json-yaml',  # Name of the URL for the schema file (from drf-yasg urls)
    'PATH_IN_MIDDLE': True, # Show paths in the middle panel
    'EXPAND_RESPONSES': 'all', # Expand all responses by default
}

# Custom setting for seeder command
SEED_DEFAULT_PASSWORD = env('SEED_DEFAULT_PASSWORD') # For the seed_database command
