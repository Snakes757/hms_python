# inquiries/views.py
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from django.utils.translation import gettext_lazy as _
from django.utils import timezone # For default created_at in serializer if needed

from .models import Inquiry, InquiryStatus
from .serializers import InquirySerializer
from users.models import UserRole
from patients.models import Patient

# Audit logging is handled by signals in audit_log.signals.py
# from audit_log.models import AuditLogAction, create_audit_log_entry
# from audit_log.utils import get_client_ip, get_user_agent

class IsOwnerOrStaffForInquiry(permissions.BasePermission):
    """
    Permission to control access to specific Inquiry objects.
    - Patient: Read-only for their own inquiries.
    - Staff (Admin, Receptionist, Nurse, Doctor):
        - Read-only for all.
        - Update/Delete (Close) for Admin, Receptionist, Nurse.
    """
    def has_object_permission(self, request, view, obj): # obj is an Inquiry instance
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == UserRole.PATIENT:
            # Patient can only view their own inquiries. Update/delete is forbidden.
            return obj.patient and obj.patient.user == user and request.method in permissions.SAFE_METHODS

        if user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR]:
            if request.method in permissions.SAFE_METHODS: # All listed staff can view
                return True
            # Only Admin, Receptionist, Nurse can update or "delete" (close)
            if request.method in ['PUT', 'PATCH', 'DELETE']:
                return user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE]
        return False

class CanCreateInquiry(permissions.BasePermission):
    """
    Permission to allow any authenticated user to create an inquiry.
    The serializer and view logic will handle specifics (e.g., patient creating for self).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class InquiryListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint for listing inquiries (filtered by user role) and creating new inquiries.
    """
    serializer_class = InquirySerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateInquiry]
    filterset_fields = ['status', 'source', 'patient__user__id', 'handled_by__id']
    search_fields = ['subject', 'description', 'inquirer_name', 'inquirer_email', 'patient__user__first_name', 'patient__user__last_name']


    def get_throttles(self):
        if self.request.method == 'POST':
            self.throttle_scope = 'inquiry_creation' # Defined in settings.REST_FRAMEWORK.DEFAULT_THROTTLE_RATES
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        user = self.request.user
        queryset = Inquiry.objects.select_related('patient__user', 'handled_by').all()

        if user.role == UserRole.PATIENT:
            patient_profile = Patient.objects.filter(user=user).first()
            queryset = queryset.filter(patient=patient_profile) if patient_profile else Inquiry.objects.none()
        elif user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.DOCTOR]:
            # If user role is not one of the above staff roles, and not a patient, deny access.
            return Inquiry.objects.none()
        # Staff (Admin, Receptionist, Nurse, Doctor) can see all by default, further filtered by query_params.
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        # Audit logging for INQUIRY_SUBMITTED is handled by signals.py
        serializer.save() # Serializer's create method handles auto-associating patient/handled_by

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class InquiryDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting (closing for non-admins) a specific inquiry.
    """
    queryset = Inquiry.objects.select_related('patient__user', 'handled_by').all()
    serializer_class = InquirySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaffForInquiry]
    lookup_field = 'id'

    def perform_update(self, serializer):
        # Audit logging for INQUIRY_UPDATED is handled by signals.py
        serializer.save() # Serializer's update method handles auto-assigning handled_by

    def perform_destroy(self, instance): # DELETE request
        user = self.request.user

        if user.role == UserRole.ADMIN: # Admin performs a hard delete
            # Audit logging for INQUIRY_DELETED (hard delete) is handled by signals.py
            super().perform_destroy(instance) # Calls instance.delete()
            # No custom response needed, DRF handles 204 NO CONTENT
        elif user.role in [UserRole.RECEPTIONIST, UserRole.NURSE]: # Staff "closes" the inquiry
            if instance.status != InquiryStatus.CLOSED:
                instance.status = InquiryStatus.CLOSED
                instance.resolution_notes = (instance.resolution_notes or "").strip() + \
                                           f"\n{_('Marked as closed by')} {user.email} on {timezone.now().strftime('%Y-%m-%d %H:%M')}."
                if not instance.handled_by:
                    instance.handled_by = user
                instance.save(update_fields=['status', 'resolution_notes', 'handled_by'])
                # Audit logging for INQUIRY_CLOSED is handled by signals.py due to post_save on status change
                
                serializer = self.get_serializer(instance) # Get updated instance data
                return Response({"message": _("Inquiry marked as closed."), "inquiry": serializer.data}, status=status.HTTP_200_OK)
            else: # Already closed
                serializer = self.get_serializer(instance)
                return Response({"message": _("Inquiry is already closed."), "inquiry": serializer.data}, status=status.HTTP_200_OK)
        else:
            # This case should ideally be caught by IsOwnerOrStaffForInquiry permission
            raise permissions.PermissionDenied(_("You do not have permission to delete this inquiry."))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
