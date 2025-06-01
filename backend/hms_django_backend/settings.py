# hms_django_backend/settings.py
from pathlib import Path
import os
from django.utils.translation import gettext_lazy as _
from dotenv import load_dotenv  # For loading .env file

# --- Core Paths ---
# BASE_DIR is the 'backend' directory if settings.py is in 'backend/hms_django_backend/'
BASE_DIR = Path(__file__).resolve().parent.parent
LOGS_DIR = BASE_DIR / 'logs'

# --- Load .env file ---
# This assumes your .env file is located in the BASE_DIR (i.e., your 'backend' folder)
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

if not LOGS_DIR.exists():
    try:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        print(f"Warning: Could not create logs directory {LOGS_DIR}.")

# --- Security ---
# SECRET_KEY will be loaded from .env or use a fallback
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY', 'django-insecure-development-fallback-key-!change-me!')
# DEBUG will be loaded from .env or use a fallback
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

# ALLOWED_HOSTS will be loaded from .env or use a fallback
ALLOWED_HOSTS_STRING = os.environ.get(
    'DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = [host.strip()
                 for host in ALLOWED_HOSTS_STRING.split(',') if host.strip()]
if DEBUG and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')


# --- Application Definition ---
INSTALLED_APPS = [
    # HMS Core Apps
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
    'drf_yasg',
    'django_filters',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'audit_log.middleware.AuditLogMiddleware',
]

ROOT_URLCONF = 'hms_django_backend.urls'
WSGI_APPLICATION = 'hms_django_backend.wsgi.application'
ASGI_APPLICATION = 'hms_django_backend.asgi.application'

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
                'django.template.context_processors.i18n',
            ],
        },
    },
]

# --- Database ---
# Values will be loaded from .env or use these fallbacks.
# Ensure your .env file has the correct DB_ENGINE for PostgreSQL.
DB_ENGINE = os.environ.get('DB_ENGINE', 'django.db.backends.postgresql')
# Default for Supabase PostgreSQL
DB_NAME = os.environ.get('DB_NAME', 'postgres')
DB_USER = os.environ.get('DB_USER', 'your_supabase_db_user_fallback')
DB_PASSWORD = os.environ.get(
    'DB_PASSWORD', 'your_supabase_db_password_fallback')
DB_HOST = os.environ.get('DB_HOST', 'your_supabase_db_host_fallback')
DB_PORT = os.environ.get('DB_PORT', '6543')  # Default Supabase pooler port

DATABASES = {
    'default': {
        'ENGINE': DB_ENGINE,
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'OPTIONS': {
            # Options for PostgreSQL.
            # 'sslmode': 'require', # Uncomment if explicit SSL mode is needed for Supabase.
            # Django usually handles SSL automatically with PostgreSQL if server requires it.
        },
        'TEST': {
            'NAME': os.environ.get('TEST_DB_NAME', f'test_{DB_NAME}'),
            # Consider if your test runner should use a local PG or Supabase.
            # For simplicity, it can mirror the default, but be mindful of test data.
        },
    }
}

# --- Authentication ---
AUTH_USER_MODEL = 'users.CustomUser'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 10}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LOGIN_URL = '/admin/login/'
LOGOUT_REDIRECT_URL = '/'

# --- Internationalization & Localization ---
LANGUAGE_CODE = os.environ.get('DJANGO_LANGUAGE_CODE', 'en-us')
TIME_ZONE = os.environ.get('DJANGO_TIME_ZONE', 'Africa/Johannesburg')
USE_I18N = True
USE_L10N = True
USE_TZ = True

# --- Static files (CSS, JavaScript, Images) ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# --- Media files (User-uploaded content) ---
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

# --- Default primary key field type ---
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'login_attempts': '10/minute',
        'register_attempts': '20/hour',
        'inquiry_creation': '30/hour',
    },
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.openapi.AutoSchema',
    'TEST_REQUEST_DEFAULT_FORMAT': 'json',
}

# --- Email Configuration ---
# Values will be loaded from .env or use these fallbacks.
EMAIL_BACKEND = os.environ.get(
    'DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('DJANGO_EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('DJANGO_EMAIL_PORT', 25))
EMAIL_USE_TLS = os.environ.get('DJANGO_EMAIL_USE_TLS', 'False') == 'True'
EMAIL_USE_SSL = os.environ.get('DJANGO_EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.environ.get('DJANGO_EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('DJANGO_EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get(
    'DJANGO_DEFAULT_FROM_EMAIL', 'noreply@hms.example.com')
SERVER_EMAIL = os.environ.get(
    'DJANGO_SERVER_EMAIL', DEFAULT_FROM_EMAIL)

ADMINS_STRING = os.environ.get('DJANGO_ADMINS', '')
ADMINS = []
if ADMINS_STRING:
    try:
        ADMINS = [tuple(admin.strip().rsplit(' <', 1)) for admin in ADMINS_STRING.split(
            ',') if '<' in admin and '>' in admin]
        ADMINS = [(name, email[:-1])
                  for name, email in ADMINS]
    except Exception:
        print(f"Warning: Could not parse DJANGO_ADMINS: {ADMINS_STRING}")

MANAGERS = ADMINS

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
        'file_debug': {
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
        # Load root log level from env
        'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file_general'] + (['mail_admins'] if not DEBUG and ADMINS else []),
            # Specific for Django logs
            'level': os.environ.get('DJANGO_LOG_LEVEL_DJANGO', 'INFO'),
            'propagate': False,
        },
        'django.request': {
            'handlers': ['mail_admins', 'file_general'],
            'level': 'ERROR',
            'propagate': False,
        },
        'users': {'handlers': ['console', 'file_debug' if DEBUG else 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'patients': {'handlers': ['console', 'file_debug' if DEBUG else 'file_general'], 'level': 'DEBUG' if DEBUG else 'INFO', 'propagate': False},
        'audit_log': {'handlers': ['console', 'file_general'], 'level': 'INFO', 'propagate': False},
        # Add other app loggers here
    }
}
if DEBUG:
    # Avoid duplicates if already added by specific logger
    if 'file_debug' not in LOGGING['root']['handlers']:
        LOGGING['root']['handlers'].append('file_debug')
    # Ensure root level is DEBUG in debug mode
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
    'USE_SESSION_AUTH': False,
    'DEFAULT_INFO': 'hms_django_backend.urls.api_info',
    'PERSIST_AUTH': True,
    'REFETCH_SCHEMA_WITH_AUTH': True,
}
REDOC_SETTINGS = {
    'LAZY_RENDERING': False,
    'SPEC_URL_NAME': 'schema-json-yaml'
}

# --- CORS Configuration ---
# if 'corsheaders' not in INSTALLED_APPS:
#     INSTALLED_APPS.append('corsheaders')
# if 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
#     # Insert CORS middleware, usually high up, but after SecurityMiddleware
#     security_middleware_index = MIDDLEWARE.index('django.middleware.security.SecurityMiddleware')
#     MIDDLEWARE.insert(security_middleware_index + 1, 'corsheaders.middleware.CorsMiddleware')

# CORS_ALLOWED_ORIGINS = os.environ.get('DJANGO_CORS_ALLOWED_ORIGINS', '').split(',')
# CORS_ALLOWED_ORIGINS = [origin for origin in CORS_ALLOWED_ORIGINS if origin] # Filter out empty strings
# if not CORS_ALLOWED_ORIGINS and DEBUG:
#     CORS_ALLOW_ALL_ORIGINS = True # For local development convenience
# else:
#     CORS_ALLOW_ALL_ORIGINS = False

# CORS_ALLOW_CREDENTIALS = True
