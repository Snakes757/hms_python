# inquiries/tests.py
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient # APITestCase creates a test DB
from django.contrib.auth import get_user_model
from django.utils import timezone

from users.models import UserRole
from patients.models import Patient
from .models import Inquiry, InquiryStatus, InquirySource
from audit_log.models import AuditLogEntry, AuditLogAction


UserModel = get_user_model()

class InquiryAPITests(APITestCase):
    """
    Test suite for the Inquiry API endpoints.
    Covers creation, listing, retrieval, updating, and deletion of inquiries
    with different user roles and permissions.
    """
    def setUp(self):
        self.client = APIClient()

        # URLs
        self.inquiry_list_create_url = reverse('inquiries-v1:inquiry-list-create') # Use versioned namespace
        self.inquiry_detail_url = lambda inquiry_id: reverse('inquiries-v1:inquiry-detail', kwargs={'id': inquiry_id})

        # Users
        self.patient_user = UserModel.objects.create_user(
            username='inq_patient_test', email='inq_patient_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Inq", last_name="Patient"
        )
        self.patient_profile = Patient.objects.get(user=self.patient_user)

        self.receptionist_user = UserModel.objects.create_user(
            username='inq_receptionist_test', email='inq_receptionist_test@example.com',
            password='StrongPassword123!', role=UserRole.RECEPTIONIST, first_name="Inq", last_name="Receptionist"
        )
        self.admin_user = UserModel.objects.create_superuser( # Superuser for full access
            username='inq_admin_test', email='inq_admin_test@example.com',
            password='StrongPassword123!', role=UserRole.ADMIN, first_name="Inq", last_name="Admin"
        )
        self.nurse_user = UserModel.objects.create_user(
            username='inq_nurse_test', email='inq_nurse_test@example.com',
            password='StrongPassword123!', role=UserRole.NURSE, first_name="Inq", last_name="Nurse"
        )


        # Data for creating inquiries
        self.inquiry_data_by_patient = {
            'subject': 'Question about my upcoming appointment',
            'description': 'I would like to know if I need to fast before my appointment next week.',
            'source': InquirySource.WEB_PORTAL,
            # patient and inquirer_name/email will be auto-filled by serializer/view if logged in as patient
        }
        self.inquiry_data_by_receptionist_for_visitor = {
            'subject': 'Visitor query about visiting hours',
            'description': 'A visitor (John Doe) called to ask about current visiting hours for Ward C.',
            'inquirer_name': 'John Doe (Visitor)',
            'inquirer_phone': '0112345678',
            'source': InquirySource.PHONE,
        }
        self.inquiry_data_by_receptionist_for_patient = {
            'subject': 'Patient called to update contact details',
            'description': 'Patient wants to update their phone number.',
            'patient': self.patient_profile.pk,
            'source': InquirySource.PHONE,
        }

    def _login_user(self, user):
        self.client.force_authenticate(user=user)

    def test_create_inquiry_as_patient(self):
        self._login_user(self.patient_user)
        response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_patient, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Inquiry.objects.count(), 1)
        inquiry = Inquiry.objects.first()
        self.assertEqual(inquiry.subject, self.inquiry_data_by_patient['subject'])
        self.assertEqual(inquiry.patient, self.patient_profile)
        self.assertEqual(inquiry.inquirer_name, self.patient_user.full_name)
        self.assertEqual(inquiry.inquirer_email, self.patient_user.email)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(inquiry.id), action=AuditLogAction.INQUIRY_SUBMITTED, user=self.patient_user
        ).exists())

    def test_create_inquiry_as_receptionist_for_visitor(self):
        self._login_user(self.receptionist_user)
        response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        inquiry = Inquiry.objects.get(subject=self.inquiry_data_by_receptionist_for_visitor['subject'])
        self.assertEqual(inquiry.inquirer_name, self.inquiry_data_by_receptionist_for_visitor['inquirer_name'])
        self.assertIsNone(inquiry.patient)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(inquiry.id), action=AuditLogAction.INQUIRY_SUBMITTED, user=self.receptionist_user
        ).exists())


    def test_create_inquiry_as_receptionist_for_existing_patient(self):
        self._login_user(self.receptionist_user)
        response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_patient, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        inquiry = Inquiry.objects.get(subject=self.inquiry_data_by_receptionist_for_patient['subject'])
        self.assertEqual(inquiry.patient, self.patient_profile)
        # Inquirer name should be auto-filled from patient profile if not provided
        self.assertEqual(inquiry.inquirer_name, self.patient_profile.user.full_name)


    def test_list_inquiries_as_receptionist(self):
        # Create some inquiries
        self.test_create_inquiry_as_patient() # Inquiry 1 by patient
        self._login_user(self.receptionist_user)
        self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json') # Inquiry 2 by receptionist

        response = self.client.get(self.inquiry_list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) # Receptionist sees all

    def test_list_inquiries_as_patient_sees_own(self):
        self._login_user(self.patient_user) # Patient logs in
        self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_patient, format='json') # Patient creates inquiry

        self._login_user(self.receptionist_user) # Receptionist logs in
        self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json') # Receptionist creates another

        self._login_user(self.patient_user) # Patient logs back in
        response = self.client.get(self.inquiry_list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1) # Should only see their own
        self.assertEqual(response.data['results'][0]['subject'], self.inquiry_data_by_patient['subject'])

    def test_retrieve_inquiry_as_owner_patient(self):
        self._login_user(self.patient_user)
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_patient, format='json')
        inquiry_id = create_response.data['id']

        response = self.client.get(self.inquiry_detail_url(inquiry_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['subject'], self.inquiry_data_by_patient['subject'])

    def test_retrieve_inquiry_as_receptionist(self):
        self._login_user(self.patient_user) # Patient creates
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_patient, format='json')
        inquiry_id = create_response.data['id']

        self._login_user(self.receptionist_user) # Receptionist retrieves
        response = self.client.get(self.inquiry_detail_url(inquiry_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_inquiry_as_nurse(self):
        self._login_user(self.receptionist_user) # Receptionist creates
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json')
        inquiry_id = create_response.data['id']

        self._login_user(self.nurse_user) # Nurse updates
        update_data = {
            'status': InquiryStatus.RESOLVED,
            'resolution_notes': 'Provided visiting hours information for Ward C as requested by Nurse.',
            # handled_by should be auto-assigned to nurse_user if not already set
        }
        response = self.client.patch(self.inquiry_detail_url(inquiry_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['status'], InquiryStatus.RESOLVED)
        self.assertEqual(response.data['resolution_notes'], update_data['resolution_notes'])
        self.assertIsNotNone(response.data['handled_by_details'])
        self.assertEqual(response.data['handled_by_details']['id'], self.nurse_user.id)
        # Check audit log
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(inquiry_id), action=AuditLogAction.INQUIRY_UPDATED, user=self.nurse_user
        ).exists())


    def test_patient_cannot_update_inquiry_status_or_resolution(self):
        self._login_user(self.patient_user)
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_patient, format='json')
        inquiry_id = create_response.data['id']

        update_data = {'status': InquiryStatus.CLOSED, 'resolution_notes': "I consider this closed myself."}
        response = self.client.patch(self.inquiry_detail_url(inquiry_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.content)

    def test_delete_inquiry_as_admin_hard_delete(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json')
        inquiry_id = create_response.data['id']

        self._login_user(self.admin_user)
        response = self.client.delete(self.inquiry_detail_url(inquiry_id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.content) # Admin hard deletes
        self.assertEqual(Inquiry.objects.count(), 0)
        # Check audit log for hard delete by admin
        self.assertTrue(AuditLogEntry.objects.filter(
            action=AuditLogAction.INQUIRY_DELETED, user=self.admin_user,
            details__icontains=f"Inquiry ID {inquiry_id}"
        ).exists())

    def test_delete_inquiry_as_receptionist_marks_as_closed(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json')
        inquiry_id = create_response.data['id']

        response = self.client.delete(self.inquiry_detail_url(inquiry_id)) # Receptionist "deletes" (closes)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content) # View returns 200 OK with message
        self.assertEqual(response.data['message'], "Inquiry marked as closed.")
        
        inquiry = Inquiry.objects.get(id=inquiry_id)
        self.assertEqual(inquiry.status, InquiryStatus.CLOSED)
        self.assertTrue(f"Marked as closed by {self.receptionist_user.email}" in inquiry.resolution_notes)
        self.assertEqual(inquiry.handled_by, self.receptionist_user) # Should be auto-assigned
        # Check audit log for inquiry closed by staff
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(inquiry_id), action=AuditLogAction.INQUIRY_CLOSED, user=self.receptionist_user
        ).exists())

    def test_create_inquiry_missing_contact_info_and_patient_fails(self):
        self._login_user(self.receptionist_user)
        bad_data = {
            'subject': 'Incomplete Inquiry',
            'description': 'This inquiry has no contact info.',
            'source': InquirySource.OTHER,
        }
        response = self.client.post(self.inquiry_list_create_url, bad_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        self.assertIn("must have an associated patient or at least one piece of inquirer contact information", str(response.data).lower())

    def test_update_inquiry_to_resolved_requires_resolution_notes(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.inquiry_list_create_url, self.inquiry_data_by_receptionist_for_visitor, format='json')
        inquiry_id = create_response.data['id']

        update_data = {'status': InquiryStatus.RESOLVED} # Missing resolution_notes
        response = self.client.patch(self.inquiry_detail_url(inquiry_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        self.assertIn("resolution_notes", response.data)
        self.assertIn("required when an inquiry is marked as Resolved or Closed", str(response.data['resolution_notes']).lower())
