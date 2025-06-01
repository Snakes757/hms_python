# users/urls.py
from django.urls import path
from .views import (
    UserRegistrationAPIView,
    UserLoginAPIView,
    UserLogoutAPIView,
    UserProfileAPIView,
    UserListAPIView,        # For admins to list/manage users
    UserDetailAdminAPIView, # For admins to retrieve/update/delete specific users
    # Add other user-related views here if any, e.g., password reset, email verification.
)

app_name = 'users'  # Namespace for these URLs

urlpatterns = [
    # Authentication Endpoints
    path('register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('login/', UserLoginAPIView.as_view(), name='user-login'),
    path('logout/', UserLogoutAPIView.as_view(), name='user-logout'),

    # Authenticated User's Own Profile Endpoint
    path('profile/me/', UserProfileAPIView.as_view(), name='user-profile'), # Changed from 'profile/' to be more specific

    # Admin User Management Endpoints
    # List all users (GET) - Admin only.
    path('', UserListAPIView.as_view(), name='user-list'),
    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific user by PK - Admin only.
    path('<int:pk>/', UserDetailAdminAPIView.as_view(), name='user-detail-admin'),
]
