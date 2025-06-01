from django.urls import path
from .views import (
    UserRegistrationAPIView,
    UserLoginAPIView,
    UserLogoutAPIView,
    UserProfileAPIView,
    UserListAPIView,
    UserDetailAdminAPIView, # Admin view for specific user details
    # Add other user-related views here if needed, e.g.,
    # PasswordChangeAPIView,
    # PasswordResetRequestAPIView,
    # PasswordResetConfirmAPIView,
)

app_name = 'users'  # Namespace for these URLs, useful for reverse URL lookups

urlpatterns = [
    # Authentication URLs
    path('register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('login/', UserLoginAPIView.as_view(), name='user-login'),
    path('logout/', UserLogoutAPIView.as_view(), name='user-logout'),

    # User Profile URL (for the authenticated user's own profile)
    path('profile/', UserProfileAPIView.as_view(), name='user-profile'),
    
    # User Management URLs (typically admin-restricted)
    # List all users (GET) - Admin only
    path('', UserListAPIView.as_view(), name='user-list'), 
    
    # Retrieve (GET), Update (PUT/PATCH), Delete (DELETE) a specific user by ID - Admin only
    path('<int:pk>/', UserDetailAdminAPIView.as_view(), name='user-detail-admin'),

    # Example: Password management URLs
    # path('password/change/', PasswordChangeAPIView.as_view(), name='password-change'),
    # path('password/reset/', PasswordResetRequestAPIView.as_view(), name='password-reset-request'),
    # path('password/reset/confirm/<uidb64>/<token>/', 
    #      PasswordResetConfirmAPIView.as_view(), name='password-reset-confirm'),
]
