# medical_management/urls.py
from django.urls import path
from .views import (
    PrescriptionListCreateAPIView,
    PrescriptionDetailAPIView,
    TreatmentListCreateAPIView,
    TreatmentDetailAPIView,
    ObservationListCreateAPIView,
    ObservationDetailAPIView,
    # Add other medical management related views here if any,
    # e.g., for specific medication lookups, or aggregated medical data reports.
)

app_name = 'medical_management'  # Namespace for these URLs

urlpatterns = [
    # Prescription Endpoints (nested under patient's user ID)
    # List (GET) or create (POST) prescriptions for a specific patient.
    path('patient/<int:patient_user_id>/prescriptions/',
         PrescriptionListCreateAPIView.as_view(),
         name='patient-prescription-list-create'),
    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific prescription.
    path('patient/<int:patient_user_id>/prescriptions/<int:record_id>/',
         PrescriptionDetailAPIView.as_view(),
         name='patient-prescription-detail'),

    # Treatment Endpoints (nested under patient's user ID)
    # List (GET) or create (POST) treatments for a specific patient.
    path('patient/<int:patient_user_id>/treatments/',
         TreatmentListCreateAPIView.as_view(),
         name='patient-treatment-list-create'),
    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific treatment.
    path('patient/<int:patient_user_id>/treatments/<int:record_id>/',
         TreatmentDetailAPIView.as_view(),
         name='patient-treatment-detail'),

    # Observation Endpoints (nested under patient's user ID)
    # List (GET) or create (POST) observations for a specific patient.
    path('patient/<int:patient_user_id>/observations/',
         ObservationListCreateAPIView.as_view(),
         name='patient-observation-list-create'),
    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific observation.
    path('patient/<int:patient_user_id>/observations/<int:record_id>/',
         ObservationDetailAPIView.as_view(),
         name='patient-observation-detail'),
]
