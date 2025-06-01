# patients/urls.py
from django.urls import path
from .views import (
    PatientListAPIView,
    PatientDetailAPIView,
    MedicalRecordListCreateAPIView,
    MedicalRecordDetailAPIView,
    # Add other patient-related views here if any, e.g., for patient search beyond list filters.
)

app_name = 'patients'  # Namespace for these URLs

urlpatterns = [
    # Patient Profile Endpoints
    # List all patients (GET) - Typically for staff/admin.
    path('', PatientListAPIView.as_view(), name='patient-list'),

    # Retrieve (GET) or update (PUT/PATCH) the authenticated patient's own profile.
    path('me/', PatientDetailAPIView.as_view(), {'user__id_alt_lookup': 'me'}, name='patient-profile-me'),
    # Using a different lookup kwarg to distinguish '/me/' from '/<int:user__id>/' in the view.

    # Retrieve (GET) or update (PUT/PATCH) a specific patient's profile by their user ID.
    # Access controlled by permissions.
    path('<int:user__id>/', PatientDetailAPIView.as_view(), name='patient-detail'),


    # Medical Record Endpoints (nested under patient's user ID)
    # List (GET) or create (POST) medical records for a specific patient.
    path('<int:patient_user_id>/medical-records/',
         MedicalRecordListCreateAPIView.as_view(),
         name='medicalrecord-list-create'),

    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific medical record.
    path('<int:patient_user_id>/medical-records/<int:record_id>/',
         MedicalRecordDetailAPIView.as_view(),
         name='medicalrecord-detail'),
]
