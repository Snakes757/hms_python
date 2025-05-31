# patients/views.py
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from .models import Patient, MedicalRecord
from .serializers import (
    PatientSerializer,
    PatientDetailSerializer,
    MedicalRecordSerializer,
)
from users.models import UserRole # CustomUser is implicitly used via Patient.user

# Audit logging is handled by signals in audit_log.signals.py
# from audit_log.models import AuditLogAction, create_audit_log_entry
# from audit_log.utils import get_client_ip, get_user_agent

class IsStaffForPatientList(permissions.BasePermission):
    """
    Allows access only to staff users (Doctor, Nurse, Admin, Receptionist)
    for listing patients.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.RECEPTIONIST]

class IsOwnerOrStaffForPatientDetail(permissions.BasePermission):
    """
    Permission to control access to specific Patient profile objects.
    - Patient: Can access/update their own profile.
    - Staff (Admin, Receptionist, Doctor, Nurse): Can access/update any patient profile.
      (Note: Specific field updates might be further restricted by serializers or view logic if needed).
    """
    def has_object_permission(self, request, view, obj): # obj is a Patient instance
        user = request.user
        if not user or not user.is_authenticated: return False

        if user.role == UserRole.PATIENT:
            return obj.user == user # Patient can only access/update their own profile

        if user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return True # Staff has access
        return False

class CanAccessPatientMedicalRecords(permissions.BasePermission):
    """
    Permission to control access to a specific patient's medical records.
    - Patient: Read-only for their own records.
    - Staff (Doctor, Nurse, Admin): Full access (create, read, update, delete) for any patient.
    """
    def _get_target_patient_user_id(self, view):
        patient_user_id_str = view.kwargs.get('patient_user_id')
        if not patient_user_id_str or not str(patient_user_id_str).isdigit():
            return None
        return int(patient_user_id_str)

    def has_permission(self, request, view): # For ListCreate views, checks access to the patient context
        user = request.user
        if not user or not user.is_authenticated: return False

        target_patient_user_id = self._get_target_patient_user_id(view)
        if target_patient_user_id is None: return False # Invalid patient_user_id in URL

        if user.role == UserRole.PATIENT:
            # Patient can list/create (though create might be restricted further) for self
            return user.id == target_patient_user_id

        if user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            return Patient.objects.filter(user__id=target_patient_user_id).exists()
        return False

    def has_object_permission(self, request, view, obj): # obj is a MedicalRecord instance
        user = request.user
        if not user or not user.is_authenticated: return False

        patient_of_record = obj.patient

        if user.role == UserRole.PATIENT:
            # Patient can only view their own medical records. Update/delete is forbidden.
            return patient_of_record.user == user and request.method in permissions.SAFE_METHODS

        if user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            # Staff can CRUD records if they passed has_permission for the patient context.
            return True
        return False

class PatientListAPIView(generics.ListAPIView):
    """
    API endpoint for listing patient profiles.
    Accessible by staff members.
    """
    queryset = Patient.objects.select_related('user').order_by('user__last_name', 'user__first_name')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffForPatientList]
    filterset_fields = ['gender', 'user__is_active', 'user__date_joined']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone_number']

class PatientDetailAPIView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving or updating a patient's profile.
    Supports '/me/' for authenticated patient's own profile, or '/<user_id>/' for staff access.
    """
    queryset = Patient.objects.select_related('user').prefetch_related('medical_records__created_by').all()
    serializer_class = PatientDetailSerializer # Includes medical records for GET
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaffForPatientDetail]
    # lookup_field is 'user__id' by default from the URL pattern for /<int:user__id>/

    def get_object(self):
        # Determine if '/me/' or '/<user_id>/' is being used
        user_id_from_url_kwarg = self.kwargs.get('user__id') # From /<int:user__id>/
        alt_lookup_value = self.kwargs.get('user__id_alt_lookup') # From path('me/', ..., {'user__id_alt_lookup': 'me'})

        user_id_to_fetch = None

        if alt_lookup_value == 'me':
            if not self.request.user.is_authenticated or self.request.user.role != UserRole.PATIENT:
                 raise permissions.PermissionDenied(
                    _("The '/me/' endpoint is for authenticated patients to access their own profile.")
                )
            user_id_to_fetch = self.request.user.id
        elif user_id_from_url_kwarg is not None and str(user_id_from_url_kwarg).isdigit():
            user_id_to_fetch = int(user_id_from_url_kwarg)
        else:
            # This should ideally result in a 404 if URL pattern doesn't match or kwarg is missing
            raise drf_serializers.ValidationError(_("Valid patient user ID must be provided in the URL."))

        # Fetch the Patient object using the user_id (which is the PK for Patient model)
        obj = get_object_or_404(self.get_queryset(), pk=user_id_to_fetch)
        self.check_object_permissions(self.request, obj) # Run IsOwnerOrStaffForPatientDetail
        return obj

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PatientSerializer # Use simpler serializer for updates (without medical_records)
        return super().get_serializer_class() # PatientDetailSerializer for GET

    def perform_update(self, serializer):
        # Audit logging for USER_PROFILE_UPDATED or PATIENT_PROFILE_UPDATED
        # is handled by signals.py based on AUDITED_MODELS_CRUD (CustomUser or Patient).
        serializer.save()

class MedicalRecordListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating medical records for a specific patient.
    """
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessPatientMedicalRecords]

    def get_patient(self):
        patient_user_id = self.kwargs.get('patient_user_id')
        # CanAccessPatientMedicalRecords.has_permission already validates access to this patient context
        return get_object_or_404(Patient.objects.select_related('user'), user__id=patient_user_id)

    def get_queryset(self):
        patient = self.get_patient()
        return MedicalRecord.objects.filter(patient=patient).select_related('created_by', 'patient__user').order_by('-record_date')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            raise permissions.PermissionDenied(_("Only Doctors, Nurses, or Admins can create medical records."))
        patient = self.get_patient()
        # Serializer's create method handles setting created_by from request.user if not provided.
        # Audit logging for MEDICAL_RECORD_CREATED is handled by signals.py.
        serializer.save(patient=patient)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        # context['patient'] = self.get_patient() # Pass patient to serializer if needed for validation
        return context

class MedicalRecordDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific medical record.
    """
    queryset = MedicalRecord.objects.select_related('patient__user', 'created_by').all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessPatientMedicalRecords]
    lookup_url_kwarg = 'record_id' # The URL kwarg for the medical record's PK

    def get_patient_from_url(self):
        patient_user_id = self.kwargs.get('patient_user_id')
        return get_object_or_404(Patient.objects.select_related('user'), user__id=patient_user_id)

    def get_object(self):
        obj = super().get_object() # Gets MedicalRecord by record_id
        patient_from_url = self.get_patient_from_url()
        if obj.patient != patient_from_url:
            raise drf_serializers.ValidationError(
                _("This medical record does not belong to the patient specified in the URL.")
            )
        # CanAccessPatientMedicalRecords.has_object_permission will be called by DRF.
        return obj

    def perform_update(self, serializer):
        user = self.request.user
        if user.role not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            raise permissions.PermissionDenied(_("Only Doctors, Nurses, or Admins can update medical records."))
        # Audit logging for MEDICAL_RECORD_UPDATED is handled by signals.py.
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role not in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
             raise permissions.PermissionDenied(_("Only Doctors, Nurses, or Admins can delete medical records."))
        # Audit logging for MEDICAL_RECORD_DELETED is handled by signals.py.
        super().perform_destroy(instance)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
