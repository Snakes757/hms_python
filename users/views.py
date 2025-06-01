# users/views.py
from django.contrib.auth import get_user_model # login, logout are not directly used here
from rest_framework import status, generics, permissions, views
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.throttling import ScopedRateThrottle

from audit_log.models import AuditLogAction # create_audit_log_entry is handled by signals
# from audit_log.utils import get_client_ip, get_user_agent # Not directly used if signals handle logging

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    CustomUserSerializer,
    UserProfileUpdateSerializer,
    AdminUserUpdateSerializer, # For admin updates
)
# from .models import CustomUser, UserRole # CustomUser is UserModel

UserModel = get_user_model()

class UserRegistrationAPIView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Allows any user to register. Creates user and associated profiles.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_scope = 'register_attempts' # Uses 'register_attempts' scope from settings

    def get_throttles(self): # Ensure throttle_scope is applied
        return [ScopedRateThrottle()] if self.throttle_scope else super().get_throttles()


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save() # Serializer's create method handles user and profile creation.
        # Audit logging for USER_REGISTERED is handled by signals.py.

        token, _ = Token.objects.get_or_create(user=user)
        user_data_display = CustomUserSerializer(user, context=self.get_serializer_context()).data
        return Response(
            {"user": user_data_display, "token": token.key, "message": "User registered successfully."},
            status=status.HTTP_201_CREATED
        )

class UserLoginAPIView(generics.GenericAPIView):
    """
    API endpoint for user login.
    Authenticates user and returns user data along with an auth token.
    """
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    throttle_scope = 'login_attempts'

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.throttle_scope else super().get_throttles()

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Validation error (400) includes audit log for LOGIN_FAILED via serializer
        
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        # Audit logging for LOGIN_SUCCESS is handled by signals.py.

        user_data_display = CustomUserSerializer(user, context=self.get_serializer_context()).data
        return Response(
            {"user": user_data_display, "token": token.key, "message": "Login successful."},
            status=status.HTTP_200_OK
        )

class UserLogoutAPIView(views.APIView):
    """
    API endpoint for user logout.
    Deletes the user's authentication token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # Delete the token associated with the user, effectively logging them out.
            if hasattr(request.user, 'auth_token') and request.user.auth_token:
                request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            pass # Token might already be deleted or user not using token auth.
        
        # Audit logging for LOGOUT is handled by signals.py.
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for authenticated users to retrieve and update their own profile.
    Uses UserProfileUpdateSerializer for updates to limit editable fields.
    """
    permission_classes = [IsAuthenticated]
    # serializer_class is determined by get_serializer_class

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return CustomUserSerializer # For GET request

    def get_object(self):
        # Returns the currently authenticated user.
        return self.request.user

    def perform_update(self, serializer):
        # Audit logging for USER_PROFILE_UPDATED is handled by signals.py.
        serializer.save()

class UserListAPIView(generics.ListAPIView):
    """
    API endpoint for listing user accounts.
    Accessible only by admin users.
    """
    queryset = UserModel.objects.select_related( # Eager load profiles for efficiency if displayed
        'doctor_profile', 'nurse_profile', 'receptionist_profile', 'admin_profile', 'patient_profile'
    ).order_by('id')
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['role', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name']

class UserDetailAdminAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for admins to retrieve, update, or delete any user account.
    Uses AdminUserUpdateSerializer for updates to allow broader field changes.
    """
    queryset = UserModel.objects.select_related(
        'doctor_profile', 'nurse_profile', 'receptionist_profile', 'admin_profile', 'patient_profile'
    ).all()
    serializer_class = AdminUserUpdateSerializer # Use specialized serializer for admin updates
    permission_classes = [IsAdminUser]
    # lookup_field = 'pk' (default)

    def perform_update(self, serializer):
        # Audit logging for ADMIN_USER_UPDATED is handled by signals.py.
        serializer.save()

    def perform_destroy(self, instance):
        # Audit logging for ADMIN_USER_DELETED is handled by signals.py.
        super().perform_destroy(instance)
