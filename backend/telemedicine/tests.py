# telemedicine/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from users.models import UserRole
from patients.models import Patient
from appointments.models import Appointment, AppointmentType, AppointmentStatus as ApptStatus
from .models import TelemedicineSession, TelemedicineSessionStatus
from audit_log.models import AuditLogEntry, AuditLogAction


UserModel = get_user_model()

class TelemedicineAPITests(TestCase):
    """
    Test suite for the TelemedicineSession API endpoints.
    """
    def setUp(self):
        self.client = APIClient()

        # Users
        self.doctor_user = UserModel.objects.create_user(
            username='tele_doctor_test', email='tele_doctor_test@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR, first_name="Tele", last_name="Doctor"
        )
        self.patient_user = UserModel.objects.create_user(
            username='tele_patient_test', email='tele_patient_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Tele", last_name="Patient"
        )
        self.patient_profile = Patient.objects.get(user=self.patient_user)

        self.admin_user = UserModel.objects.create_superuser(
            username='tele_admin_test', email='tele_admin_test@example.com',
            password='StrongPassword123!', role=UserRole.ADMIN
        )
        self.receptionist_user = UserModel.objects.create_user(
            username='tele_receptionist_test', email='tele_receptionist_test@example.com',
            password='StrongPassword123!', role=UserRole.RECEPTIONIST
        )
        self.other_doctor_user = UserModel.objects.create_user(
            username='other_tele_doc_test', email='other_tele_doc_test@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR, first_name="OtherTele", last_name="Doctor"
        )
        self.other_patient_user = UserModel.objects.create_user(
            username='other_tele_pat_test', email='other_tele_pat_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="OtherTele", last_name="Patient"
        )
        self.other_patient_profile = Patient.objects.get(user=self.other_patient_user)


        # Linked Telemedicine Appointment
        self.telemedicine_appointment = Appointment.objects.create(
            patient=self.patient_profile, doctor=self.doctor_user,
            appointment_type=AppointmentType.TELEMEDICINE,
            appointment_date_time=timezone.now() + timedelta(days=3),
            status=ApptStatus.CONFIRMED, scheduled_by=self.receptionist_user,
            estimated_duration_minutes=30, reason="Follow-up via telemedicine."
        )

        # URLs (using versioned namespaces)
        self.list_create_url = reverse('telemedicine-v1:telemedicine-session-list-create')
        self.detail_url = lambda pk: reverse('telemedicine-v1:telemedicine-session-detail', kwargs={'id': pk})

        # Sample Data
        self.session_data_with_appt = {
            # patient and doctor will be auto-filled from appointment if provided
            'appointment': self.telemedicine_appointment.pk,
            'session_start_time': (self.telemedicine_appointment.appointment_date_time + timedelta(minutes=5)).isoformat(), # Start slightly after appt time
            'estimated_duration_minutes': 25, # Can differ
            'session_url': 'https://meet.example.com/session_linked_123',
            'reason_for_consultation': 'Specific follow-up questions for linked appointment.',
            'status': TelemedicineSessionStatus.SCHEDULED.value,
        }
        self.session_data_adhoc = {
            'patient': self.patient_profile.pk,
            'doctor': self.doctor_user.pk,
            'session_start_time': (timezone.now() + timedelta(days=5)).isoformat(),
            'estimated_duration_minutes': 20,
            'session_url': 'https://meet.example.com/adhoc_session_456',
            'reason_for_consultation': 'Urgent query about medication (ad-hoc).',
            'status': TelemedicineSessionStatus.SCHEDULED.value,
        }

    def _login_user(self, user):
        self.client.force_authenticate(user=user)

    def test_create_telemedicine_session_with_appointment_as_receptionist(self):
        self._login_user(self.receptionist_user)
        response = self.client.post(self.list_create_url, self.session_data_with_appt, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(TelemedicineSession.objects.count(), 1)
        session = TelemedicineSession.objects.first()
        self.assertEqual(session.appointment, self.telemedicine_appointment)
        self.assertEqual(session.patient, self.patient_profile) # Auto-filled from appointment
        self.assertEqual(session.doctor, self.doctor_user)     # Auto-filled from appointment
        self.assertEqual(session.reason_for_consultation, self.session_data_with_appt['reason_for_consultation'])
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(session.id), action=AuditLogAction.TELEMED_SESSION_CREATED, user=self.receptionist_user
        ).exists())

    def test_create_adhoc_telemedicine_session_as_doctor(self):
        self._login_user(self.doctor_user)
        response = self.client.post(self.list_create_url, self.session_data_adhoc, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        session = TelemedicineSession.objects.get(session_url=self.session_data_adhoc['session_url'])
        self.assertIsNone(session.appointment)
        self.assertEqual(session.patient, self.patient_profile)
        self.assertEqual(session.doctor, self.doctor_user)

    def test_create_session_patient_self_booking_allowed(self): # Assuming patients can initiate/request
        self._login_user(self.patient_user)
        data = self.session_data_adhoc.copy()
        # Patient must specify doctor for ad-hoc
        data['doctor'] = self.doctor_user.pk
        # Patient field will be auto-set by view/serializer if they are the one making the request
        del data['patient'] # Remove to test auto-fill

        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        session = TelemedicineSession.objects.get(session_url=data['session_url'])
        self.assertEqual(session.patient, self.patient_profile) # Auto-set to logged-in patient
        self.assertEqual(session.doctor, self.doctor_user)


    def test_list_telemedicine_sessions_as_admin(self):
        self.test_create_adhoc_telemedicine_session_as_doctor()
        self._login_user(self.admin_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_sessions_as_doctor_sees_own_and_linked_appointment_doctor(self):
        self.test_create_adhoc_telemedicine_session_as_doctor() # Session for self.doctor_user
        # Session for another doctor
        TelemedicineSession.objects.create(
            patient=self.patient_profile, doctor=self.other_doctor_user,
            session_start_time=timezone.now() + timedelta(days=6), status=TelemedicineSessionStatus.SCHEDULED
        )
        self.assertEqual(TelemedicineSession.objects.count(), 2)

        self._login_user(self.doctor_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1) # Only their own session
        self.assertEqual(response.data['results'][0]['doctor_details']['id'], self.doctor_user.id)

    def test_list_sessions_as_patient_sees_own(self):
        self.test_create_adhoc_telemedicine_session_as_doctor() # Session for self.patient_profile
        # Session for another patient
        TelemedicineSession.objects.create(
            patient=self.other_patient_profile, doctor=self.doctor_user,
            session_start_time=timezone.now() + timedelta(days=7), status=TelemedicineSessionStatus.SCHEDULED
        )
        self.assertEqual(TelemedicineSession.objects.count(), 2)

        self._login_user(self.patient_user)
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['patient_details']['user']['id'], self.patient_user.id)

    def test_retrieve_session_as_participating_doctor(self):
        self._login_user(self.doctor_user)
        create_response = self.client.post(self.list_create_url, self.session_data_adhoc, format='json')
        session_id = create_response.data['id']
        response = self.client.get(self.detail_url(session_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], session_id)

    def test_update_session_status_by_doctor_and_complete_appointment(self):
        self._login_user(self.receptionist_user) # Receptionist creates session linked to appointment
        create_response = self.client.post(self.list_create_url, self.session_data_with_appt, format='json')
        session_id = create_response.data['id']
        linked_appointment = Appointment.objects.get(pk=self.session_data_with_appt['appointment'])
        self.assertNotEqual(linked_appointment.status, ApptStatus.COMPLETED) # Ensure it's not already completed

        self._login_user(self.doctor_user) # Doctor updates
        update_data = {'status': TelemedicineSessionStatus.IN_PROGRESS.value}
        response = self.client.patch(self.detail_url(session_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['status'], TelemedicineSessionStatus.IN_PROGRESS.value)

        update_data_completed = {
            'status': TelemedicineSessionStatus.COMPLETED.value,
            'session_end_time': (timezone.now() + timedelta(days=3, minutes=30)).isoformat(),
            'doctor_notes': 'Consultation completed successfully.'
        }
        response = self.client.patch(self.detail_url(session_id), update_data_completed, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['status'], TelemedicineSessionStatus.COMPLETED.value)
        
        linked_appointment.refresh_from_db()
        self.assertEqual(linked_appointment.status, ApptStatus.COMPLETED) # Check if linked appointment was completed
        # Check audit log for session update
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(session_id), action=AuditLogAction.TELEMED_SESSION_UPDATED, user=self.doctor_user
        ).exists())
        # Check audit log for appointment update (due to status change)
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(linked_appointment.id), action=AuditLogAction.APPOINTMENT_COMPLETED, user=self.doctor_user # Or generic UPDATED
        ).exists())


    def test_patient_cannot_update_session_details_except_feedback(self):
        self._login_user(self.doctor_user) # Doctor creates
        create_response = self.client.post(self.list_create_url, self.session_data_adhoc, format='json')
        session_id = create_response.data['id']

        self._login_user(self.patient_user) # Patient attempts update
        update_data_status = {'status': TelemedicineSessionStatus.CANCELLED.value}
        response_status = self.client.patch(self.detail_url(session_id), update_data_status, format='json')
        self.assertEqual(response_status.status_code, status.HTTP_403_FORBIDDEN, "Patient should not change status.")

        update_data_feedback = {'patient_feedback': 'The session was helpful.'}
        response_feedback = self.client.patch(self.detail_url(session_id), update_data_feedback, format='json')
        self.assertEqual(response_feedback.status_code, status.HTTP_200_OK, response_feedback.content) # Patient can add feedback
        self.assertEqual(response_feedback.data['patient_feedback'], update_data_feedback['patient_feedback'])


    def test_delete_session_as_admin_hard_deletes(self):
        self._login_user(self.doctor_user)
        create_response = self.client.post(self.list_create_url, self.session_data_adhoc, format='json')
        session_id = create_response.data['id']

        self._login_user(self.admin_user)
        response = self.client.delete(self.detail_url(session_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.content)
        self.assertEqual(TelemedicineSession.objects.count(), 0)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            action=AuditLogAction.TELEMED_SESSION_DELETED, user=self.admin_user,
            details__icontains=f"ID {session_id}"
        ).exists())


    def test_delete_active_session_as_doctor_marks_cancelled(self):
        self._login_user(self.doctor_user)
        create_response = self.client.post(self.list_create_url, self.session_data_adhoc, format='json')
        session_id = create_response.data['id']

        response = self.client.delete(self.detail_url(session_id)) # Doctor "deletes" (cancels)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content) # View returns 200 OK with message
        self.assertIn("cancelled", response.data['message'].lower())
        
        session = TelemedicineSession.objects.get(id=session_id)
        self.assertEqual(session.status, TelemedicineSessionStatus.CANCELLED)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(session_id), action=AuditLogAction.TELEMED_SESSION_CANCELLED, user=self.doctor_user
        ).exists())

    def test_doctor_schedule_conflict_telemedicine(self):
        self._login_user(self.doctor_user)
        # Create first session
        self.client.post(self.list_create_url, self.session_data_adhoc, format='json')
        
        # Attempt to create another session at the exact same time for the same doctor
        conflicting_data = self.session_data_adhoc.copy()
        conflicting_data['patient'] = self.other_patient_profile.pk # Different patient
        conflicting_data['session_url'] += "_conflict"
        
        response = self.client.post(self.list_create_url, conflicting_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        self.assertTrue(
            any("conflicting telemedicine session" in str(e).lower() for e_list in response.data.values() for e in e_list if isinstance(e, list)) or \
            any("unique_doctor_telemedicine_time" in str(e).lower() for e_list in response.data.values() for e in e_list if isinstance(e, list))
            , response.content
        )
