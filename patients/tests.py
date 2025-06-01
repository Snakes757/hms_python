# patients/tests.py
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from users.models import UserRole
from .models import Patient, MedicalRecord, Gender
from audit_log.models import AuditLogEntry, AuditLogAction

UserModel = get_user_model()

class PatientAPITests(APITestCase):
    """
    Test suite for the Patient and MedicalRecord API endpoints.
    """
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin_user = UserModel.objects.create_superuser(
            username='patient_admin_test', email='patient_admin_test@example.com',
            password='StrongPassword123!', role=UserRole.ADMIN
        )
        self.doctor_user = UserModel.objects.create_user(
            username='patient_doctor_test', email='patient_doctor_test@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR, first_name="PatientDr", last_name="Test"
        )
        self.patient_user1 = UserModel.objects.create_user(
            username='patient_one_test', email='patient_one_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Patient", last_name="One"
        )
        self.patient_profile1 = Patient.objects.get(user=self.patient_user1)

        self.patient_user2 = UserModel.objects.create_user(
            username='patient_two_test', email='patient_two_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Patient", last_name="Two"
        )
        self.patient_profile2 = Patient.objects.get(user=self.patient_user2)

        # URLs (using versioned namespaces)
        self.patient_list_url = reverse('patients-v1:patient-list')
        self.patient_profile_me_url = reverse('patients-v1:patient-profile-me')
        self.patient_detail_by_id_url = lambda user_id: reverse('patients-v1:patient-detail', kwargs={'user__id': user_id})
        self.medical_record_list_create_url = lambda patient_user_id: reverse(
            'patients-v1:medicalrecord-list-create', kwargs={'patient_user_id': patient_user_id}
        )
        self.medical_record_detail_url = lambda patient_user_id, record_id: reverse(
            'patients-v1:medicalrecord-detail', kwargs={'patient_user_id': patient_user_id, 'record_id': record_id}
        )

        # Sample Data
        self.patient_profile_update_data = {
            'date_of_birth': (date.today() - timedelta(days=365*30)).isoformat(),
            'gender': Gender.FEMALE.value, # Use .value for choice fields
            'address': '123 Test St, Testville, GP, 1234',
            'phone_number': '0821234567',
            'emergency_contact_name': 'Jane Doe',
            'emergency_contact_phone': '0839876543'
        }
        self.medical_record_data = {
            'diagnosis': 'Common Cold', 'symptoms': 'Runny nose, cough.',
            'treatment_plan': 'Rest, fluids.', 'notes': 'Advised follow-up if no improvement.',
            'record_date': timezone.now().isoformat()
            # 'patient' and 'created_by' will be handled by view/serializer context
        }

    def _login_user(self, user):
        self.client.force_authenticate(user=user)

    # --- Patient Profile Tests ---
    def test_list_patients_as_doctor(self): # Changed from admin to doctor for variety
        self._login_user(self.doctor_user)
        response = self.client.get(self.patient_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) >= 2) # patient1 and patient2

    def test_list_patients_as_patient_forbidden(self):
        self._login_user(self.patient_user1)
        response = self.client.get(self.patient_list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_patient_profile_me_as_patient(self):
        self._login_user(self.patient_user1)
        response = self.client.get(self.patient_profile_me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['id'], self.patient_user1.id)

    def test_retrieve_patient_profile_by_id_as_owner_patient(self):
        self._login_user(self.patient_user1)
        response = self.client.get(self.patient_detail_by_id_url(self.patient_user1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['id'], self.patient_user1.id)

    def test_retrieve_other_patient_profile_by_id_as_patient_forbidden(self):
        self._login_user(self.patient_user1)
        response = self.client.get(self.patient_detail_by_id_url(self.patient_user2.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_patient_profile_by_id_as_doctor(self):
        self._login_user(self.doctor_user)
        response = self.client.get(self.patient_detail_by_id_url(self.patient_user1.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['id'], self.patient_user1.id)

    def test_update_patient_profile_me_as_patient(self):
        self._login_user(self.patient_user1)
        response = self.client.patch(self.patient_profile_me_url, self.patient_profile_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['address'], self.patient_profile_update_data['address'])
        self.patient_profile1.refresh_from_db()
        self.assertEqual(self.patient_profile1.address, self.patient_profile_update_data['address'])
        self.assertEqual(str(self.patient_profile1.date_of_birth), self.patient_profile_update_data['date_of_birth'])
        # Check audit log for profile update by self
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(self.patient_user1.id), # Logged against CustomUser
            action=AuditLogAction.USER_PROFILE_UPDATED, # Specific action for self-update
            user=self.patient_user1
        ).exists())

    def test_update_patient_profile_by_id_as_admin(self):
        self._login_user(self.admin_user)
        update_data = {'phone_number': '0115559999', 'gender': Gender.MALE.value}
        response = self.client.patch(self.patient_detail_by_id_url(self.patient_user1.id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['phone_number'], update_data['phone_number'])
        self.patient_profile1.refresh_from_db()
        self.assertEqual(self.patient_profile1.phone_number, update_data['phone_number'])
        self.assertEqual(self.patient_profile1.gender, Gender.MALE)
        # Check audit log for profile update by admin
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(self.patient_user1.id), # Logged against CustomUser
            action=AuditLogAction.PATIENT_PROFILE_UPDATED, # Or ADMIN_USER_UPDATED if more generic
            user=self.admin_user
        ).exists())


    # --- Medical Record Tests ---
    def test_create_medical_record_as_doctor(self):
        self._login_user(self.doctor_user)
        url = self.medical_record_list_create_url(self.patient_user1.id)
        response = self.client.post(url, self.medical_record_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(MedicalRecord.objects.count(), 1)
        record = MedicalRecord.objects.first()
        self.assertEqual(record.patient, self.patient_profile1)
        self.assertEqual(record.created_by, self.doctor_user)
        self.assertEqual(record.diagnosis, self.medical_record_data['diagnosis'])
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(record.id), action=AuditLogAction.MEDICAL_RECORD_CREATED, user=self.doctor_user
        ).exists())

    def test_create_medical_record_as_patient_forbidden(self):
        self._login_user(self.patient_user1)
        url = self.medical_record_list_create_url(self.patient_user1.id)
        response = self.client.post(url, self.medical_record_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_medical_records_as_owner_patient(self):
        self._login_user(self.doctor_user) # Doctor creates records
        self.client.post(self.medical_record_list_create_url(self.patient_user1.id), self.medical_record_data, format='json')
        self.client.post(self.medical_record_list_create_url(self.patient_user2.id), self.medical_record_data, format='json')
        self.assertEqual(MedicalRecord.objects.count(), 2)

        self._login_user(self.patient_user1) # Patient 1 logs in
        url = self.medical_record_list_create_url(self.patient_user1.id)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['diagnosis'], self.medical_record_data['diagnosis'])

    def test_retrieve_medical_record_as_doctor(self):
        self._login_user(self.doctor_user)
        create_url = self.medical_record_list_create_url(self.patient_user1.id)
        create_response = self.client.post(create_url, self.medical_record_data, format='json')
        record_id = create_response.data['id']

        detail_url = self.medical_record_detail_url(self.patient_user1.id, record_id)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], record_id)

    def test_update_medical_record_as_creating_doctor(self):
        self._login_user(self.doctor_user)
        create_url = self.medical_record_list_create_url(self.patient_user1.id)
        create_response = self.client.post(create_url, self.medical_record_data, format='json')
        record_id = create_response.data['id']

        update_data = {'symptoms': 'Updated: Sore throat and fatigue.'}
        detail_url = self.medical_record_detail_url(self.patient_user1.id, record_id)
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['symptoms'], update_data['symptoms'])
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(record_id), action=AuditLogAction.MEDICAL_RECORD_UPDATED, user=self.doctor_user
        ).exists())

    def test_patient_cannot_update_medical_record(self):
        self._login_user(self.doctor_user) # Doctor creates
        create_url = self.medical_record_list_create_url(self.patient_user1.id)
        create_response = self.client.post(create_url, self.medical_record_data, format='json')
        record_id = create_response.data['id']

        self._login_user(self.patient_user1) # Patient attempts update
        update_data = {'diagnosis': 'Self-diagnosed improvement.'}
        detail_url = self.medical_record_detail_url(self.patient_user1.id, record_id)
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_medical_record_as_admin(self):
        self._login_user(self.doctor_user) # Doctor creates
        create_url = self.medical_record_list_create_url(self.patient_user1.id)
        create_response = self.client.post(create_url, self.medical_record_data, format='json')
        record_id = create_response.data['id']

        self._login_user(self.admin_user) # Admin deletes
        detail_url = self.medical_record_detail_url(self.patient_user1.id, record_id)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MedicalRecord.objects.count(), 0)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            action=AuditLogAction.MEDICAL_RECORD_DELETED, user=self.admin_user,
            details__icontains=f"ID {record_id}"
        ).exists())
