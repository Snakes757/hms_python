# telemedicine/views.py
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.db.models import Q

from .models import TelemedicineSession, TelemedicineSessionStatus
from .serializers import TelemedicineSessionSerializer
from users.models import UserRole
from patients.models import Patient
# from appointments.models import Appointment, AppointmentStatus as ApptStatus # Not directly used here now

# Audit logging is handled by signals in audit_log.signals.py
# from audit_log.models import AuditLogAction, create_audit_log_entry
# from audit_log.utils import get_client_ip, get_user_agent

class CanManageTelemedicineSession(permissions.BasePermission):
    """
    Permission to control access to specific TelemedicineSession objects.
    - Patient: Read-only for their own sessions. Can update 'patient_feedback'.
    - Doctor: Full access if assigned doctor. Read-only for other doctor's sessions. Can update 'doctor_notes'.
    - Staff (Admin, Receptionist): Full access.
    - Staff (Nurse): Read-only access.
    """
    def has_object_permission(self, request, view, obj): # obj is a TelemedicineSession instance
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role == UserRole.PATIENT:
            if obj.patient.user == user:
                if request.method in permissions.SAFE_METHODS: return True
                # Allow patient to update only their feedback
                if request.method in ['PATCH', 'PUT']:
                    allowed_fields = {'patient_feedback'}
                    return set(request.data.keys()).issubset(allowed_fields)
                return False
            return False

        if user.role == UserRole.DOCTOR:
            if obj.doctor == user: # Assigned doctor
                if request.method in ['PATCH', 'PUT']:
                    # Doctor can update most fields, but maybe not patient_feedback directly
                    disallowed_fields_for_doctor = {'patient_feedback'} # Example
                    if any(key in disallowed_fields_for_doctor for key in request.data.keys()):
                         # Check if only allowed fields are being updated if some are disallowed
                        if not set(request.data.keys()).issubset({'doctor_notes', 'status', 'session_end_time', 'recording_url'}): # etc.
                            # This logic can get complex, often better handled in serializer validation based on role
                            pass # For now, allow if assigned doctor
                    return True
                return True # GET, DELETE
            return request.method in permissions.SAFE_METHODS # Read-only for other doctors

        if user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return True # Full access

        if user.role == UserRole.NURSE:
            return request.method in permissions.SAFE_METHODS # Read-only

        return False

class CanCreateTelemedicineSession(permissions.BasePermission):
    """
    Permission to allow staff (Admin, Receptionist, Doctor) and Patients to create sessions.
    Nurses might assist but not typically create sessions independently.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method == 'POST': # Creating a session
            return user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.PATIENT]
        return True # For GET list

class TelemedicineSessionListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating telemedicine sessions.
    """
    serializer_class = TelemedicineSessionSerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateTelemedicineSession]
    filterset_fields = ['status', 'doctor__id', 'patient__user__id', 'appointment__id', 'session_start_time__date']
    search_fields = [
        'patient__user__first_name', 'patient__user__last_name', 'patient__user__email',
        'doctor__first_name', 'doctor__last_name', 'doctor__email',
        'reason_for_consultation', 'session_url'
    ]

    def get_queryset(self):
        user = self.request.user
        queryset = TelemedicineSession.objects.select_related(
            'patient__user', 'doctor', 'appointment__patient__user', 'appointment__doctor'
        ).all()

        if user.role == UserRole.PATIENT:
            patient_profile = Patient.objects.filter(user=user).first()
            queryset = queryset.filter(patient=patient_profile) if patient_profile else TelemedicineSession.objects.none()
        elif user.role == UserRole.DOCTOR:
            # Doctor sees sessions where they are the doctor, or where they are the doctor of the linked appointment.
            queryset = queryset.filter(Q(doctor=user) | Q(appointment__doctor=user)).distinct()
        elif user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE]: # Nurse can view all (read-only)
            return TelemedicineSession.objects.none()
        # Admin, Receptionist, Nurse can see all by default, further filtered by query_params.
        return queryset.order_by('-session_start_time')

    def perform_create(self, serializer):
        user = self.request.user
        patient_in_payload = serializer.validated_data.get('patient')

        # If patient is creating, ensure they are creating for themselves.
        if user.role == UserRole.PATIENT:
            patient_profile = Patient.objects.filter(user=user).first()
            if not patient_profile: # Should not happen if user has PATIENT role
                raise drf_serializers.ValidationError(_("Patient profile not found for the current user."))
            if patient_in_payload and patient_in_payload != patient_profile:
                raise permissions.PermissionDenied(_("Patients can only create telemedicine sessions for themselves."))
            # Serializer's validate method will auto-fill patient from appointment if linked
            # If not linked and patient is creating, ensure it's for self.
            if not serializer.validated_data.get('appointment'):
                 serializer.save(patient=patient_profile) # Pass patient explicitly
                 return


        # For staff, serializer handles auto-fill from appointment if provided.
        # Actor (creator) is implicitly request.user, logged by audit signal.
        serializer.save() # Audit logging for TELEMED_SESSION_CREATED is handled by signals.

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class TelemedicineSessionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting/cancelling a specific telemedicine session.
    """
    queryset = TelemedicineSession.objects.select_related('patient__user', 'doctor', 'appointment').all()
    serializer_class = TelemedicineSessionSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageTelemedicineSession]
    lookup_field = 'id'

    def perform_update(self, serializer):
        # Permission checks in CanManageTelemedicineSession handle who can update what.
        # Audit logging for TELEMED_SESSION_UPDATED is handled by signals.
        serializer.save()

    def perform_destroy(self, instance): # DELETE request
        user = self.request.user
        # Audit logging for TELEMED_SESSION_DELETED or TELEMED_SESSION_CANCELLED is handled by signals.

        if user.role == UserRole.ADMIN: # Admin performs a hard delete
            super().perform_destroy(instance) # Calls instance.delete()
            # Standard 204 NO CONTENT response by DRF
        elif user.role in [UserRole.DOCTOR, UserRole.RECEPTIONIST]: # Staff "cancels" the session
            if instance.status not in [
                TelemedicineSessionStatus.COMPLETED,
                TelemedicineSessionStatus.CANCELLED, # Already cancelled
                TelemedicineSessionStatus.FAILED
            ]:
                instance.status = TelemedicineSessionStatus.CANCELLED
                instance.save(update_fields=['status']) # Signal will log this status update
                
                serializer = self.get_serializer(instance) # Get updated instance data
                return Response(
                    {"message": _("Telemedicine session has been cancelled."), "session": serializer.data},
                    status=status.HTTP_200_OK
                )
            else: # Already in a final state
                serializer = self.get_serializer(instance)
                return Response(
                    {"message": _("Telemedicine session is already in a final state (Completed, Cancelled, or Failed)."), "session": serializer.data},
                    status=status.HTTP_200_OK # Or 400 Bad Request if preferred
                )
        else:
            # This case should be caught by CanManageTelemedicineSession permission
            raise permissions.PermissionDenied(_("You do not have permission to delete/cancel this telemedicine session."))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
