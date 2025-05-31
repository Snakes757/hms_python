from django.urls import path
from .views import (
    TelemedicineSessionListCreateAPIView,
    TelemedicineSessionDetailAPIView,
    # Add other telemedicine-related views here if needed, e.g.,
    # DoctorTelemedicineScheduleView,
    # PatientTelemedicineHistoryView,
)

app_name = 'telemedicine'  # Namespace for these URLs, useful for reverse URL lookups

urlpatterns = [
    # URL for listing all telemedicine sessions (GET, with filtering based on user role) 
    # and creating a new telemedicine session (POST)
    path('', TelemedicineSessionListCreateAPIView.as_view(), name='telemedicine-session-list-create'),

    # URL for retrieving (GET), updating (PUT/PATCH), or deleting (DELETE/Cancel) a specific telemedicine session.
    # The <int:id> part captures the session's primary key from the URL.
    path('<int:id>/', TelemedicineSessionDetailAPIView.as_view(), name='telemedicine-session-detail'),
    
    # Example: URL for a doctor to view their upcoming telemedicine sessions
    # path('doctor/my-schedule/', DoctorTelemedicineScheduleView.as_view(), name='doctor-telemedicine-schedule'),
    
    # Example: URL for a patient to join a specific session (might involve more complex logic/view)
    # path('<int:id>/join/', JoinTelemedicineSessionView.as_view(), name='telemedicine-session-join'),
]
