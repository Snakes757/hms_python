from django.urls import path
from .views import (
    AppointmentListCreateAPIView,
    AppointmentDetailAPIView,
    # Add other views here if created, e.g., for specific appointment actions
    # DoctorAvailabilityAPIView,
    # PatientAppointmentHistoryAPIView,
)

app_name = 'appointments'  # Namespace for these URLs, useful for reverse URL lookups

urlpatterns = [
    # URL for listing all appointments (GET) and creating a new appointment (POST)
    path('', AppointmentListCreateAPIView.as_view(), name='appointment-list-create'),

    # URL for retrieving (GET), updating (PUT/PATCH), and deleting (DELETE) a specific appointment
    # The <int:id> part captures the appointment's primary key from the URL.
    path('<int:id>/', AppointmentDetailAPIView.as_view(), name='appointment-detail'),
    
    # Example: URL for a doctor to view their schedule for a specific day
    # path('doctor-schedule/<int:doctor_id>/<str:date>/', DoctorScheduleView.as_view(), name='doctor-schedule'),
    
    # Example: URL for a patient to view their upcoming appointments
    # path('patient/<int:patient_id>/upcoming/', PatientUpcomingAppointmentsView.as_view(), name='patient-upcoming-appointments'),
]
