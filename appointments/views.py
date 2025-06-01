# appointments/views.py
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from django.utils.translation import gettext_lazy as _

from .models import Appointment, AppointmentStatus
from .serializers import AppointmentSerializer
from users.models import UserRole
from patients.models import Patient

from audit_log.models import AuditLogAction, create_audit_log_entry
from audit_log.utils import get_client_ip, get_user_agent

class IsOwnerOrStaffForAppointment(permissions.BasePermission):
    """
    Permission to allow access if the user is the patient owner, assigned doctor,
    or authorized staff (Admin, Receptionist). Nurses have read-only access.
    """
    def has_object_permission(self, request, view, obj): # obj is an Appointment instance
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Patient access
        if user.role == UserRole.PATIENT:
            if obj.patient.user == user:
                if request.method in permissions.SAFE_METHODS: return True # Read-only
                # Allow patient to cancel their own upcoming appointment
                if request.method in ['PATCH', 'PUT'] and 'status' in request.data:
                    allowed_status_change = request.data.get('status') == AppointmentStatus.CANCELLED_BY_PATIENT
                    is_not_finalized = obj.status not in [
                        AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED_BY_STAFF,
                        AppointmentStatus.NO_SHOW, AppointmentStatus.RESCHEDULED
                    ]
                    # Check if only 'status' field is being updated
                    is_only_status_update = set(request.data.keys()) == {'status'}

                    return allowed_status_change and is_not_finalized and is_only_status_update
                return False # Deny other modifications by patient
            return False # Not their appointment

        # Doctor access
        if user.role == UserRole.DOCTOR:
            if obj.doctor == user: return True # Full access if assigned doctor
            return request.method in permissions.SAFE_METHODS # Read-only for other doctors

        # Admin and Receptionist access
        if user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return True # Full access

        # Nurse access
        if user.role == UserRole.NURSE:
            return request.method in permissions.SAFE_METHODS # Read-only for nurses

        return False

class IsStaffToCreateOrPatientForSelf(permissions.BasePermission):
    """
    Permission to allow staff (Admin, Receptionist, Doctor, Nurse) to create any appointment,
    and patients to create appointments for themselves.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method == 'POST': # Creating an appointment
            if user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE]:
                return True
            if user.role == UserRole.PATIENT:
                # Patient creating for self: serializer will validate this further
                return True
            return False
        return True # For GET list, queryset filtering will handle specifics

class AppointmentListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating appointments.
    Filtering by user role is applied to the queryset.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffToCreateOrPatientForSelf]
    filterset_fields = ['status', 'appointment_type', 'doctor__id', 'patient__user__id']
    search_fields = [
        'patient__user__first_name', 'patient__user__last_name', 'patient__user__email',
        'doctor__first_name', 'doctor__last_name', 'doctor__email', 'reason'
    ]


    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.select_related('patient__user', 'doctor', 'scheduled_by').all()

        if user.role == UserRole.PATIENT:
            patient_profile = Patient.objects.filter(user=user).first()
            queryset = queryset.filter(patient=patient_profile) if patient_profile else Appointment.objects.none()
        elif user.role == UserRole.DOCTOR:
            queryset = queryset.filter(doctor=user)
        # Admin, Receptionist, Nurse can see all by default (further filtering via query_params)
        elif user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.NURSE]:
            return Appointment.objects.none()

        # Date range filtering
        date_from_param = self.request.query_params.get('date_from')
        if date_from_param:
            try: queryset = queryset.filter(appointment_date_time__date__gte=date_from_param)
            except ValueError: pass # Ignore invalid date format

        date_to_param = self.request.query_params.get('date_to')
        if date_to_param:
            try: queryset = queryset.filter(appointment_date_time__date__lte=date_to_param)
            except ValueError: pass

        return queryset.order_by('appointment_date_time')

    def perform_create(self, serializer):
        user = self.request.user
        # Serializer's create method already handles setting scheduled_by based on request.user
        # and validating if a patient is booking for themselves.
        appointment = serializer.save()
        # Audit logging is handled by signals.py

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class AppointmentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific appointment.
    """
    queryset = Appointment.objects.select_related('patient__user', 'doctor', 'scheduled_by').all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaffForAppointment]
    lookup_field = 'id'

    def perform_update(self, serializer):
        # Audit logging is handled by signals.py
        serializer.save()

    def perform_destroy(self, instance): # DELETE request
        user = self.request.user
        action_taken_detail = _("hard deleted by admin %(admin_email)s") % {'admin_email': user.email}
        audit_action = AuditLogAction.DELETED # Default for admin hard delete

        # Non-admin users (Doctor, Receptionist, Nurse) "cancel" instead of hard delete.
        # Patient cancellation is handled by PATCH to update status.
        if user.role != UserRole.ADMIN:
            if instance.status not in [
                AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED_BY_PATIENT,
                AppointmentStatus.CANCELLED_BY_STAFF, AppointmentStatus.NO_SHOW,
                AppointmentStatus.RESCHEDULED
            ]:
                original_status_label = instance.get_status_display()
                instance.status = AppointmentStatus.CANCELLED_BY_STAFF # Staff cancellation
                instance.save(update_fields=['status'])
                
                action_taken_detail = _("cancelled (status changed from %(original_status)s to Cancelled by Staff) by %(staff_email)s") % {
                    'original_status': original_status_label,
                    'staff_email': user.email
                }
                audit_action = AuditLogAction.APPOINTMENT_CANCELLED
                
                # Audit log for cancellation is handled by post_save signal
                # Return a custom response indicating cancellation
                serializer = self.get_serializer(instance)
                return Response({
                    "message": _("Appointment has been cancelled."),
                    "appointment": serializer.data
                }, status=status.HTTP_200_OK)
            else:
                # If already in a final state, non-admins cannot "delete" (cancel) further.
                raise permissions.PermissionDenied(_("Cannot modify a finalized or already cancelled appointment."))
        
        # If admin, proceed with hard delete
        instance_id_for_log = instance.id
        patient_name_for_log = instance.patient.user.full_name
        instance.delete() # Actual deletion by admin

        # Explicit audit log for hard delete by admin, as post_save won't fire on delete.
        # However, a pre_delete signal could also handle this.
        # For consistency, if pre_delete handles DELETED, this might be redundant.
        # Assuming pre_delete signal handles general DELETED.
        # If not, uncomment and refine this:
        # create_audit_log_entry(
        #     user=user,
        #     action=audit_action, # Should be AuditLogAction.DELETED
        #     # target_object cannot be instance as it's deleted. Store repr or use pre_delete.
        #     details=f"Appointment ID {instance_id_for_log} for {patient_name_for_log} was {action_taken_detail}.",
        #     ip_address=get_client_ip(self.request),
        #     user_agent=get_user_agent(self.request),
        #     additional_info={'deleted_appointment_id': instance_id_for_log}
        # )
        # Standard DRF behavior for DELETE is 204 NO CONTENT, so no custom Response needed here for admin.

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
