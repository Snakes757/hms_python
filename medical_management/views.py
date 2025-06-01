# medical_management/views.py
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from .models import Prescription, Treatment, Observation
from .serializers import PrescriptionSerializer, TreatmentSerializer, ObservationSerializer
from users.models import UserRole
from patients.models import Patient

# Audit logging is handled by signals in audit_log.signals.py
# from audit_log.models import AuditLogAction, create_audit_log_entry
# from audit_log.utils import get_client_ip, get_user_agent

class IsDoctor(permissions.BasePermission):
    """Allows access only to users with the DOCTOR role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.DOCTOR

class IsDoctorOrNurse(permissions.BasePermission):
    """Allows access only to users with DOCTOR or NURSE roles."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.role in [UserRole.DOCTOR, UserRole.NURSE]

class CanViewPatientMedicalInfo(permissions.BasePermission):
    """
    Permission to control access to a specific patient's medical information.
    - Patient: Can access their own records.
    - Staff (Doctor, Nurse, Admin): Can access records of any patient they are authorized to view.
    """
    def has_permission(self, request, view): # For ListCreate views, checks access to the patient context
        user = request.user
        if not user or not user.is_authenticated:
            return False

        patient_user_id_str = view.kwargs.get('patient_user_id')
        if not patient_user_id_str or not str(patient_user_id_str).isdigit():
            # This should ideally be caught by URL pattern validation or raise a 404 earlier
            return False # Or raise Http404

        target_patient_user_id = int(patient_user_id_str)

        if user.role == UserRole.PATIENT:
            return user.id == target_patient_user_id # Patient can only access their own context

        if user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            # Check if the target patient actually exists
            return Patient.objects.filter(user__id=target_patient_user_id).exists()
        return False

    def has_object_permission(self, request, view, obj): # For Detail views, obj is Prescription/Treatment/Observation
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # The object (Prescription, Treatment, Observation) must belong to the patient specified in the URL.
        # This is implicitly checked by get_object in detail views.
        # Here, we check if the user has rights to this specific object's patient.
        patient_of_record = obj.patient

        if user.role == UserRole.PATIENT:
            return patient_of_record.user == user # Patient can only access records linked to them

        if user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]:
            return True # Staff has access if they passed has_permission for the patient context
        return False


class BasePatientMedicalRecordListView(generics.ListCreateAPIView):
    """
    Abstract base class for listing and creating medical records (Prescription, Treatment, Observation)
    for a specific patient. Handles patient retrieval and common permission checks.
    """
    permission_classes = [permissions.IsAuthenticated, CanViewPatientMedicalInfo]
    # Specific creation permissions (e.g. IsDoctor for Prescriptions) will be added in subclasses.

    def get_patient(self):
        patient_user_id = self.kwargs.get('patient_user_id')
        # CanViewPatientMedicalInfo already checks if patient_user_id is valid and if user can access this patient.
        # If that permission passed, we can assume the patient exists.
        return get_object_or_404(Patient.objects.select_related('user'), user__id=patient_user_id)

    def get_queryset(self):
        # This method must be implemented by subclasses to filter by the specific model.
        raise NotImplementedError("Subclasses must implement get_queryset.")

    def perform_create(self, serializer):
        # This method must be implemented by subclasses to set patient and actor (e.g., prescribed_by).
        raise NotImplementedError("Subclasses must implement perform_create.")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        # context['patient'] = self.get_patient() # Pass patient to serializer if needed for validation
        return context

class BasePatientMedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Abstract base class for retrieving, updating, and deleting specific medical records.
    """
    permission_classes = [permissions.IsAuthenticated, CanViewPatientMedicalInfo]
    lookup_url_kwarg = 'record_id' # The URL kwarg for the record's PK

    def get_patient_from_url(self): # Helper to get patient from URL context
        patient_user_id = self.kwargs.get('patient_user_id')
        return get_object_or_404(Patient.objects.select_related('user'), user__id=patient_user_id)

    def get_object(self): # Ensures the record_id belongs to the patient_user_id in URL
        obj = super().get_object() # Gets record by record_id using self.queryset
        patient_from_url = self.get_patient_from_url()
        if obj.patient != patient_from_url:
            # This indicates a mismatch between the record's patient and the patient in the URL.
            raise drf_serializers.ValidationError( # Or Http404 or PermissionDenied
                _("This medical record does not belong to the specified patient in the URL.")
            )
        # CanViewPatientMedicalInfo.has_object_permission will be called by DRF after this.
        return obj

    def perform_update(self, serializer):
        # Audit logging is handled by signals.py
        serializer.save()

    def perform_destroy(self, instance):
        # Audit logging is handled by signals.py
        super().perform_destroy(instance)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# --- Prescription Views ---
class PrescriptionListCreateAPIView(BasePatientMedicalRecordListView):
    serializer_class = PrescriptionSerializer
    permission_classes = BasePatientMedicalRecordListView.permission_classes + [IsDoctor] # Only Doctors can create

    def get_queryset(self):
        patient = self.get_patient()
        return Prescription.objects.filter(patient=patient).select_related(
            'patient__user', 'prescribed_by', 'appointment', 'medical_record'
        ).order_by('-prescription_date')

    def perform_create(self, serializer):
        patient = self.get_patient()
        # Serializer's create method handles setting prescribed_by from request.user
        serializer.save(patient=patient) # Audit log PRESCRIPTION_ISSUED handled by signals

class PrescriptionDetailAPIView(BasePatientMedicalRecordDetailView):
    queryset = Prescription.objects.select_related('patient__user', 'prescribed_by', 'appointment', 'medical_record').all()
    serializer_class = PrescriptionSerializer
    permission_classes = BasePatientMedicalRecordDetailView.permission_classes + [IsDoctor] # Only Doctors manage

# --- Treatment Views ---
class TreatmentListCreateAPIView(BasePatientMedicalRecordListView):
    serializer_class = TreatmentSerializer
    permission_classes = BasePatientMedicalRecordListView.permission_classes + [IsDoctorOrNurse] # Doctors or Nurses can create

    def get_queryset(self):
        patient = self.get_patient()
        return Treatment.objects.filter(patient=patient).select_related(
            'patient__user', 'administered_by', 'appointment', 'medical_record'
        ).order_by('-treatment_date_time')

    def perform_create(self, serializer):
        patient = self.get_patient()
        # Serializer's create method handles setting administered_by from request.user
        serializer.save(patient=patient) # Audit log TREATMENT_RECORDED handled by signals

class TreatmentDetailAPIView(BasePatientMedicalRecordDetailView):
    queryset = Treatment.objects.select_related('patient__user', 'administered_by', 'appointment', 'medical_record').all()
    serializer_class = TreatmentSerializer
    permission_classes = BasePatientMedicalRecordDetailView.permission_classes + [IsDoctorOrNurse] # Doctors or Nurses manage

# --- Observation Views ---
class ObservationListCreateAPIView(BasePatientMedicalRecordListView):
    serializer_class = ObservationSerializer
    permission_classes = BasePatientMedicalRecordListView.permission_classes + [IsDoctorOrNurse] # Doctors or Nurses can create

    def get_queryset(self):
        patient = self.get_patient()
        return Observation.objects.filter(patient=patient).select_related(
            'patient__user', 'observed_by', 'appointment', 'medical_record'
        ).order_by('-observation_date_time')

    def perform_create(self, serializer):
        patient = self.get_patient()
        # Serializer's create method handles setting observed_by from request.user
        serializer.save(patient=patient) # Audit log OBSERVATION_LOGGED handled by signals

class ObservationDetailAPIView(BasePatientMedicalRecordDetailView):
    queryset = Observation.objects.select_related('patient__user', 'observed_by', 'appointment', 'medical_record').all()
    serializer_class = ObservationSerializer
    permission_classes = BasePatientMedicalRecordDetailView.permission_classes + [IsDoctorOrNurse] # Doctors or Nurses manage
