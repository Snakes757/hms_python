# admin_dashboard/urls.py
from django.urls import path
from .views import (
    ReportListView,
    PatientStatisticsReportView,
    AppointmentReportView,
    FinancialReportView,
    StaffActivityReportView,
    # Placeholder for future views if DashboardPreference API is needed:
    # DashboardPreferenceAPIView,
)

app_name = 'admin_dashboard'

urlpatterns = [
    # Report Views
    path('reports/', ReportListView.as_view(), name='report_list'),
    path('reports/patient-statistics/', PatientStatisticsReportView.as_view(), name='report_patient_statistics'),
    path('reports/appointment-report/', AppointmentReportView.as_view(), name='report_appointment'),
    path('reports/financial-report/', FinancialReportView.as_view(), name='report_financial'),
    path('reports/staff-activity-report/', StaffActivityReportView.as_view(), name='report_staff_activity'),

    # Example URL for DashboardPreference API (if implemented)
    # This would typically be a RetrieveUpdateAPIView for the logged-in admin user's preferences.
    # path('preferences/', DashboardPreferenceAPIView.as_view(), name='dashboard_preferences'),
]
