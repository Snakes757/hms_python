# appointments/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from users.models import UserRole
from patients.models import Patient
from .models import Appointment, AppointmentType, AppointmentStatus
from audit_log.models import AuditLogEntry, AuditLogAction

UserModel = get_user_model()

class AppointmentAPITests(TestCase):
    """
    Test suite for the Appointment API endpoints.
    Covers creation, listing, retrieval, updating, and deletion of appointments
    with different user roles and permissions.
    """
    def setUp(self):
        self.client = APIClient()

        # Create users with different roles
        self.admin_user = UserModel.objects.create_superuser(
            username='app_admin_test', email='app_admin_test@example.com',
            password='StrongPassword123!', role=UserRole.ADMIN
        )
        self.doctor_user = UserModel.objects.create_user(
            username='app_doctor_test', email='app_doctor_test@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR, first_name="App", last_name="Doctor"
        )
        self.patient_user = UserModel.objects.create_user(
            username='app_patient_test', email='app_patient_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="App", last_name="Patient"
        )
        # Patient profile is created by a signal in patients.apps
        self.patient_profile = Patient.objects.get(user=self.patient_user)

        self.receptionist_user = UserModel.objects.create_user(
            username='app_receptionist_test', email='app_receptionist_test@example.com',
            password='StrongPassword123!', role=UserRole.RECEPTIONIST, first_name="App", last_name="Receptionist"
        )
        
        self.other_doctor_user = UserModel.objects.create_user(
            username='other_doctor_test', email='other_doctor_test@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR, first_name="Other", last_name="Doctor"
        )
        self.other_patient_user = UserModel.objects.create_user(
            username='other_patient_test', email='other_patient_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Other", last_name="Patient"
        )
        self.other_patient_profile = Patient.objects.get(user=self.other_patient_user)


        # URLs
        self.list_create_url = reverse('appointments:appointment-list-create')
        self.detail_url = lambda pk: reverse('appointments:appointment-detail', kwargs={'id': pk})

        # Common appointment data
        self.appointment_data = {
            'patient': self.patient_profile.pk,
            'doctor': self.doctor_user.pk,
            'appointment_type': AppointmentType.GENERAL_CONSULTATION,
            'appointment_date_time': (timezone.now() + timedelta(days=7)).isoformat(),
            'estimated_duration_minutes': 30,
            'reason': 'Annual check-up'
        }

    def _login_user(self, user):
        """Helper method to log in a user and set credentials."""
        self.client.force_authenticate(user=user)

    def test_create_appointment_as_patient(self):
        self._login_user(self.patient_user)
        response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Appointment.objects.count(), 1)
        appointment = Appointment.objects.first()
        self.assertEqual(appointment.patient, self.patient_profile)
        self.assertEqual(appointment.doctor, self.doctor_user)
        self.assertEqual(appointment.scheduled_by, self.patient_user) # Check scheduled_by
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=appointment.id, 
            action=AuditLogAction.APPOINTMENT_SCHEDULED,
            user=self.patient_user
        ).exists())


    def test_create_appointment_as_receptionist(self):
        self._login_user(self.receptionist_user)
        response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Appointment.objects.count(), 1)
        appointment = Appointment.objects.first()
        self.assertEqual(appointment.scheduled_by, self.receptionist_user)

    def test_list_appointments_as_admin(self):
        self.test_create_appointment_as_receptionist() # Create one appointment
        self._login_user(self.admin_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_appointments_as_doctor_sees_own(self):
        self.test_create_appointment_as_receptionist() # Creates an appointment for self.doctor_user
        Appointment.objects.create( # Appointment for another doctor
            patient=self.other_patient_profile, doctor=self.other_doctor_user,
            appointment_type=AppointmentType.FOLLOW_UP,
            appointment_date_time=timezone.now() + timedelta(days=8),
            scheduled_by = self.admin_user
        )
        self.assertEqual(Appointment.objects.count(), 2)

        self._login_user(self.doctor_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1) # Should only see their own
        self.assertEqual(response.data['results'][0]['doctor_details']['id'], self.doctor_user.id)

    def test_list_appointments_as_patient_sees_own(self):
        self.test_create_appointment_as_receptionist() # Creates an appointment for self.patient_profile
        Appointment.objects.create( # Appointment for another patient
            patient=self.other_patient_profile, doctor=self.doctor_user,
            appointment_type=AppointmentType.FOLLOW_UP,
            appointment_date_time=timezone.now() + timedelta(days=8),
            scheduled_by = self.admin_user
        )
        self.assertEqual(Appointment.objects.count(), 2)

        self._login_user(self.patient_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1) # Should only see their own
        self.assertEqual(response.data['results'][0]['patient_details']['user']['id'], self.patient_user.id)

    def test_retrieve_appointment_as_owner_patient(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        appointment_id = create_response.data['id']

        self._login_user(self.patient_user)
        response = self.client.get(self.detail_url(appointment_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], appointment_id)

    def test_update_appointment_status_by_patient_to_cancel(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        appointment_id = create_response.data['id']

        self._login_user(self.patient_user)
        update_data = {'status': AppointmentStatus.CANCELLED_BY_PATIENT}
        response = self.client.patch(self.detail_url(appointment_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['status'], AppointmentStatus.CANCELLED_BY_PATIENT)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=appointment_id, 
            action=AuditLogAction.APPOINTMENT_CANCELLED, # Specific action
            user=self.patient_user
        ).exists())

    def test_patient_cannot_update_other_fields(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        appointment_id = create_response.data['id']

        self._login_user(self.patient_user)
        update_data = {'reason': 'Updated reason by patient'} # Trying to update a non-status field
        response = self.client.patch(self.detail_url(appointment_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.content)

    def test_delete_appointment_as_admin_hard_deletes(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        appointment_id = create_response.data['id']

        self._login_user(self.admin_user)
        response = self.client.delete(self.detail_url(appointment_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.content)
        self.assertEqual(Appointment.objects.count(), 0)
        # Check audit log for hard delete by admin
        self.assertTrue(AuditLogEntry.objects.filter(
            action=AuditLogAction.DELETED, # Generic DELETED or specific APPOINTMENT_DELETED
            user=self.admin_user,
            # target_object_id might not exist if instance is gone, check details
            details__icontains=f"Appointment ID {appointment_id}" 
        ).exists())


    def test_delete_appointment_as_receptionist_marks_cancelled_by_staff(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        appointment_id = create_response.data['id']

        response = self.client.delete(self.detail_url(appointment_id))
        # The view now returns 200 OK with a message for non-admin "delete" (cancel)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertIn("cancelled", response.data.get("message", "").lower())
        
        appointment = Appointment.objects.get(id=appointment_id)
        self.assertEqual(appointment.status, AppointmentStatus.CANCELLED_BY_STAFF)
         # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=appointment_id, 
            action=AuditLogAction.APPOINTMENT_CANCELLED,
            user=self.receptionist_user
        ).exists())

    def test_appointment_time_conflict_db_constraint(self):
        self._login_user(self.receptionist_user)
        # Create first appointment
        self.client.post(self.list_create_url, self.appointment_data, format='json')
        self.assertEqual(Appointment.objects.count(), 1)

        # Attempt to create conflicting appointment for the same doctor at the same time
        conflicting_data = self.appointment_data.copy()
        conflicting_data['patient'] = self.other_patient_profile.pk # Different patient, same doctor/time
        
        response = self.client.post(self.list_create_url, conflicting_data, format='json')
        # This should now be caught by the DB unique constraint for (doctor, appointment_date_time)
        # for statuses SCHEDULED or CONFIRMED.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        self.assertTrue(
            any("unique_doctor_time_appointment" in str(e).lower() for e_list in response.data.values() for e in e_list) or \
            any("conflicting appointment" in str(e).lower() for e_list in response.data.values() for e in e_list)
            , response.content
        )
    
    def test_reschedule_appointment(self):
        self._login_user(self.receptionist_user)
        # Create original appointment
        original_response = self.client.post(self.list_create_url, self.appointment_data, format='json')
        self.assertEqual(original_response.status_code, status.HTTP_201_CREATED)
        original_appointment_id = original_response.data['id']

        # Data for the new (rescheduled) appointment
        rescheduled_data = self.appointment_data.copy()
        rescheduled_data['appointment_date_time'] = (timezone.now() + timedelta(days=14)).isoformat()
        rescheduled_data['original_appointment'] = original_appointment_id
        # The status of the new appointment will be SCHEDULED by default

        reschedule_response = self.client.post(self.list_create_url, rescheduled_data, format='json')
        self.assertEqual(reschedule_response.status_code, status.HTTP_201_CREATED, reschedule_response.content)
        
        new_appointment_id = reschedule_response.data['id']
        new_appointment = Appointment.objects.get(id=new_appointment_id)
        original_appointment = Appointment.objects.get(id=original_appointment_id)

        self.assertEqual(new_appointment.original_appointment, original_appointment)
        self.assertEqual(original_appointment.status, AppointmentStatus.RESCHEDULED)
        self.assertEqual(new_appointment.status, AppointmentStatus.SCHEDULED) # New one is scheduled
