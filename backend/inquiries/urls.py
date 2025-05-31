from django.urls import path
from .views import (
    InquiryListCreateAPIView,
    InquiryDetailAPIView,
    # Add other inquiry-related views here if needed, e.g.,
    # PatientInquiryHistoryAPIView,
    # AssignInquiryToStaffAPIView,
)

app_name = 'inquiries'  # Namespace for these URLs, useful for reverse URL lookups

urlpatterns = [
    # URL for listing all inquiries (GET, with filtering based on user role) 
    # and creating a new inquiry (POST)
    path('', InquiryListCreateAPIView.as_view(), name='inquiry-list-create'),

    # URL for retrieving (GET), updating (PUT/PATCH), or deleting (DELETE) a specific inquiry.
    # The <int:id> part captures the inquiry's primary key from the URL.
    path('<int:id>/', InquiryDetailAPIView.as_view(), name='inquiry-detail'),
    
    # Example: URL for a staff member to view inquiries assigned to them
    # path('my-assigned/', MyAssignedInquiriesView.as_view(), name='my-assigned-inquiries'),
]
