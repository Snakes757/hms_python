# medical_management/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from users.models import UserRole
from patients.models import Patient, MedicalRecord
from appointments.models import Appointment, AppointmentStatus as ApptStatus, AppointmentType
from .models import Prescription, Treatment, Observation
from audit_log.models import AuditLogEntry, AuditLogAction

UserModel = get_user_model()

class MedicalManagementAPITests(TestCase):
    """
    Test suite for the Medical Management API endpoints (Prescriptions, Treatments, Observations).
    """
    def setUp(self):
        self.client = APIClient()

        # Users
        self.doctor_user = UserModel.objects.create_user(
            username='med_mgmt_doctor', email='med_mgmt_doctor@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR, first_name="Med", last_name="Doctor"
        )
        self.nurse_user = UserModel.objects.create_user(
            username='med_mgmt_nurse', email='med_mgmt_nurse@example.com',
            password='StrongPassword123!', role=UserRole.NURSE, first_name="Med", last_name="Nurse"
        )
        self.patient_user = UserModel.objects.create_user(
            username='med_mgmt_patient', email='med_mgmt_patient@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Med", last_name="Patient"
        )
        self.patient_profile = Patient.objects.get(user=self.patient_user)

        self.other_patient_user = UserModel.objects.create_user(
            username='other_med_patient', email='other_med_patient@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="OtherMed", last_name="Patient"
        )
        self.other_patient_profile = Patient.objects.get(user=self.other_patient_user)


        # Associated records
        self.appointment = Appointment.objects.create(
            patient=self.patient_profile, doctor=self.doctor_user,
            appointment_type=AppointmentType.GENERAL_CONSULTATION,
            appointment_date_time=timezone.now() - timedelta(days=1),
            status=ApptStatus.COMPLETED, scheduled_by=self.doctor_user
        )
        self.medical_record_entry = MedicalRecord.objects.create(
            patient=self.patient_profile, created_by=self.doctor_user,
            diagnosis="Initial checkup record for Med Patient"
        )

        # URLs (using versioned namespaces)
        self.prescription_list_create_url = lambda patient_user_id: reverse(
            'medical_management-v1:patient-prescription-list-create', kwargs={'patient_user_id': patient_user_id}
        )
        self.prescription_detail_url = lambda patient_user_id, record_id: reverse(
            'medical_management-v1:patient-prescription-detail', kwargs={'patient_user_id': patient_user_id, 'record_id': record_id}
        )
        self.treatment_list_create_url = lambda patient_user_id: reverse(
            'medical_management-v1:patient-treatment-list-create', kwargs={'patient_user_id': patient_user_id}
        )
        self.treatment_detail_url = lambda patient_user_id, record_id: reverse(
            'medical_management-v1:patient-treatment-detail', kwargs={'patient_user_id': patient_user_id, 'record_id': record_id}
        )
        self.observation_list_create_url = lambda patient_user_id: reverse(
            'medical_management-v1:patient-observation-list-create', kwargs={'patient_user_id': patient_user_id}
        )
        self.observation_detail_url = lambda patient_user_id, record_id: reverse(
            'medical_management-v1:patient-observation-detail', kwargs={'patient_user_id': patient_user_id, 'record_id': record_id}
        )

        # Sample Data
        self.prescription_data = {
            'patient': self.patient_profile.pk, # Will be set by URL or validated against it
            # 'prescribed_by': self.doctor_user.pk, # Will be set by logged-in user
            'medication_name': 'Amoxicillin', 'dosage': '250mg',
            'frequency': 'TID (Three times a day)', 'duration_days': 7,
            'instructions': 'Take with food.', 'prescription_date': date.today().isoformat(),
            'appointment': self.appointment.pk, 'medical_record': self.medical_record_entry.pk,
        }
        self.treatment_data = {
            'patient': self.patient_profile.pk,
            # 'administered_by': self.nurse_user.pk,
            'treatment_name': 'Wound Dressing',
            'treatment_date_time': (timezone.now() - timedelta(hours=2)).isoformat(),
            'description': 'Cleaned and dressed minor abrasion.', 'outcome': 'Healing well.',
            'appointment': self.appointment.pk,
        }
        self.observation_data = {
            'patient': self.patient_profile.pk,
            # 'observed_by': self.nurse_user.pk,
            'symptoms_observed': 'Patient reports mild headache.',
            'vital_signs': {'temperature': '37.0C', 'blood_pressure': '120/80'},
            'description': 'Patient is alert and oriented.',
            'observation_date_time': (timezone.now() - timedelta(hours=1)).isoformat(),
        }

    def _login_user(self, user):
        self.client.force_authenticate(user=user)

    # --- Prescription Tests ---
    def test_create_prescription_as_doctor(self):
        self._login_user(self.doctor_user)
        url = self.prescription_list_create_url(self.patient_user.id)
        response = self.client.post(url, self.prescription_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Prescription.objects.count(), 1)
        prescription = Prescription.objects.first()
        self.assertEqual(prescription.medication_name, self.prescription_data['medication_name'])
        self.assertEqual(prescription.prescribed_by, self.doctor_user)
        self.assertEqual(prescription.patient, self.patient_profile)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(prescription.id), action=AuditLogAction.PRESCRIPTION_ISSUED, user=self.doctor_user
        ).exists())

    def test_create_prescription_as_nurse_forbidden(self):
        self._login_user(self.nurse_user)
        url = self.prescription_list_create_url(self.patient_user.id)
        data = self.prescription_data.copy()
        # data['prescribed_by'] = self.nurse_user.pk # Serializer sets prescribed_by from request.user
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.content) # View permission

    def test_list_prescriptions_as_patient_sees_own(self):
        self.test_create_prescription_as_doctor() # Creates one for self.patient_user
        # Create prescription for another patient by the same doctor
        Prescription.objects.create(
            patient=self.other_patient_profile, prescribed_by=self.doctor_user,
            medication_name="Paracetamol", dosage="500mg", frequency="PRN",
            prescription_date=date.today()
        )
        self.assertEqual(Prescription.objects.count(), 2)

        self._login_user(self.patient_user)
        url = self.prescription_list_create_url(self.patient_user.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['medication_name'], self.prescription_data['medication_name'])

    def test_retrieve_prescription_as_doctor(self):
        self._login_user(self.doctor_user)
        create_url = self.prescription_list_create_url(self.patient_user.id)
        create_response = self.client.post(create_url, self.prescription_data, format='json')
        prescription_id = create_response.data['id']

        detail_url = self.prescription_detail_url(self.patient_user.id, prescription_id)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], prescription_id)

    def test_update_prescription_as_prescribing_doctor(self):
        self._login_user(self.doctor_user)
        create_url = self.prescription_list_create_url(self.patient_user.id)
        create_response = self.client.post(create_url, self.prescription_data, format='json')
        prescription_id = create_response.data['id']
        
        update_data = {'instructions': 'Take after meals.', 'is_active': False}
        detail_url = self.prescription_detail_url(self.patient_user.id, prescription_id)
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['instructions'], update_data['instructions'])
        self.assertEqual(response.data['is_active'], False)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(prescription_id), action=AuditLogAction.PRESCRIPTION_UPDATED, user=self.doctor_user
        ).exists())


    def test_delete_prescription_as_prescribing_doctor(self):
        self._login_user(self.doctor_user)
        create_url = self.prescription_list_create_url(self.patient_user.id)
        create_response = self.client.post(create_url, self.prescription_data, format='json')
        prescription_id = create_response.data['id']

        detail_url = self.prescription_detail_url(self.patient_user.id, prescription_id)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.content)
        self.assertEqual(Prescription.objects.count(), 0)
         # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            action=AuditLogAction.PRESCRIPTION_DELETED, user=self.doctor_user,
            details__icontains=f"ID {prescription_id}"
        ).exists())


    # --- Treatment Tests ---
    def test_create_treatment_as_nurse(self):
        self._login_user(self.nurse_user)
        url = self.treatment_list_create_url(self.patient_user.id)
        response = self.client.post(url, self.treatment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Treatment.objects.count(), 1)
        treatment = Treatment.objects.first()
        self.assertEqual(treatment.treatment_name, self.treatment_data['treatment_name'])
        self.assertEqual(treatment.administered_by, self.nurse_user)
        self.assertEqual(treatment.patient, self.patient_profile)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(treatment.id), action=AuditLogAction.TREATMENT_RECORDED, user=self.nurse_user
        ).exists())


    def test_list_treatments_as_doctor(self):
        self.test_create_treatment_as_nurse() # Create one treatment
        self._login_user(self.doctor_user) # Doctor logs in
        url = self.treatment_list_create_url(self.patient_user.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    # --- Observation Tests ---
    def test_create_observation_as_doctor(self):
        self._login_user(self.doctor_user)
        url = self.observation_list_create_url(self.patient_user.id)
        response = self.client.post(url, self.observation_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Observation.objects.count(), 1)
        observation = Observation.objects.first()
        self.assertEqual(observation.symptoms_observed, self.observation_data['symptoms_observed'])
        self.assertEqual(observation.observed_by, self.doctor_user)
        self.assertEqual(observation.patient, self.patient_profile)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(observation.id), action=AuditLogAction.OBSERVATION_LOGGED, user=self.doctor_user
        ).exists())

    def test_list_observations_as_patient_sees_own(self):
        self.test_create_observation_as_doctor() # Creates one for self.patient_user
        # Create observation for another patient by the same doctor
        Observation.objects.create(
            patient=self.other_patient_profile, observed_by=self.doctor_user,
            description="Routine check for other patient."
        )
        self.assertEqual(Observation.objects.count(), 2)
        
        self._login_user(self.patient_user)
        url = self.observation_list_create_url(self.patient_user.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['symptoms_observed'], self.observation_data['symptoms_observed'])

    def test_patient_cannot_create_medical_records(self):
        self._login_user(self.patient_user)
        # Prescription
        url_presc = self.prescription_list_create_url(self.patient_user.id)
        response_presc = self.client.post(url_presc, self.prescription_data, format='json')
        self.assertEqual(response_presc.status_code, status.HTTP_403_FORBIDDEN)
        # Treatment
        url_treat = self.treatment_list_create_url(self.patient_user.id)
        response_treat = self.client.post(url_treat, self.treatment_data, format='json')
        self.assertEqual(response_treat.status_code, status.HTTP_403_FORBIDDEN)
        # Observation
        url_obs = self.observation_list_create_url(self.patient_user.id)
        response_obs = self.client.post(url_obs, self.observation_data, format='json')
        self.assertEqual(response_obs.status_code, status.HTTP_403_FORBIDDEN)
