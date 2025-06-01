# audit_log/tests.py
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from unittest.mock import patch # For mocking request attributes or middleware functions

from .models import AuditLogEntry, AuditLogAction, create_audit_log_entry
from .middleware import get_client_ip, get_user_agent, AuditLogMiddleware, get_current_request, get_current_user
from patients.models import Patient # Example model to use as a target_object
from users.models import UserRole # For creating users with roles

UserModel = get_user_model()

class AuditLogUtilTests(TestCase):
    """Tests for utility functions in audit_log.utils and middleware."""
    def setUp(self):
        self.factory = RequestFactory()

    def test_get_client_ip(self):
        request_xff = self.factory.get('/', HTTP_X_FORWARDED_FOR='192.0.2.1, 198.51.100.2')
        self.assertEqual(get_client_ip(request_xff), '192.0.2.1')
        request_remote_addr = self.factory.get('/', REMOTE_ADDR='192.168.1.100')
        self.assertEqual(get_client_ip(request_remote_addr), '192.168.1.100')
        self.assertIsNone(get_client_ip(None)) # Test with None request

    def test_get_user_agent(self):
        ua_string = "TestAgent/1.0"
        request_with_ua = self.factory.get('/', HTTP_USER_AGENT=ua_string)
        self.assertEqual(get_user_agent(request_with_ua), ua_string)
        request_no_ua = self.factory.get('/')
        self.assertEqual(get_user_agent(request_no_ua), '') # Default to empty string
        self.assertEqual(get_user_agent(None), '') # Test with None request

    def test_audit_log_middleware(self):
        """Test that AuditLogMiddleware correctly sets and clears thread_locals.request."""
        def get_response_mock(request):
            # Simulate accessing request from thread_locals during request processing
            self.assertEqual(get_current_request(), request)
            return "mock_response"

        middleware = AuditLogMiddleware(get_response_mock)
        request = self.factory.get('/')
        
        # Before middleware call, request should not be in thread_locals
        self.assertIsNone(get_current_request())
        
        response = middleware(request)
        
        self.assertEqual(response, "mock_response")
        # After middleware call, request should be cleared from thread_locals
        self.assertIsNone(get_current_request())


class AuditLogSignalTests(TestCase):
    """Tests for audit log signal handlers."""
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username='audit_testuser_signals',
            email='audit_testuser_signals@example.com',
            password='StrongPassword123!',
            role=UserRole.PATIENT # Example role
        )
        self.factory = RequestFactory()
        # Minimal patient profile for testing model signals
        self.patient_profile = Patient.objects.get(user=self.user)


    def test_user_logged_in_signal_creates_log(self):
        request = self.factory.get('/fake-login')
        request.META['REMOTE_ADDR'] = '127.0.0.1'
        request.META['HTTP_USER_AGENT'] = 'TestAgent/Login'
        
        user_logged_in.send(sender=self.user.__class__, request=request, user=self.user)
        
        log_entry = AuditLogEntry.objects.filter(user=self.user, action=AuditLogAction.LOGIN_SUCCESS).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.ip_address, '127.0.0.1')
        self.assertEqual(log_entry.user_agent, 'TestAgent/Login')
        self.assertIn(self.user.email, log_entry.details)

    def test_user_logged_out_signal_creates_log(self):
        request = self.factory.get('/fake-logout')
        request.META['REMOTE_ADDR'] = '10.0.0.5'
        request.user = self.user # Simulate authenticated user for logout signal
        
        user_logged_out.send(sender=self.user.__class__, request=request, user=self.user)
        
        log_entry = AuditLogEntry.objects.filter(user=self.user, action=AuditLogAction.LOGOUT).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.ip_address, '10.0.0.5')

    def test_user_login_failed_signal_creates_log(self):
        credentials = {'email': 'failed_attempt_signals@example.com'}
        request = self.factory.post('/fake-login-fail', data=credentials)
        request.META['REMOTE_ADDR'] = '192.168.0.10'
        
        user_login_failed.send(sender=UserModel, credentials=credentials, request=request)
        
        log_entry = AuditLogEntry.objects.filter(action=AuditLogAction.LOGIN_FAILED, details__icontains=credentials['email']).first()
        self.assertIsNotNone(log_entry)
        self.assertIsNone(log_entry.user)
        self.assertEqual(log_entry.ip_address, '192.168.0.10')

    @patch('audit_log.signals.get_current_user') # Mock to simulate user context for model signals
    @patch('audit_log.signals.get_current_request') # Mock to simulate request context
    def test_model_post_save_create_signal(self, mock_get_request, mock_get_user):
        """Test audit log creation when an audited model instance is created."""
        mock_request = self.factory.get('/')
        mock_request.user = self.user
        mock_get_request.return_value = mock_request
        mock_get_user.return_value = self.user

        # Patient model is in AUDITED_MODELS_CRUD
        # Creating a new user with PATIENT role will trigger Patient.post_save via users.signals
        # which in turn creates a Patient profile. The Patient profile creation should be audited.
        new_patient_user = UserModel.objects.create_user(
            username='new_audit_patient', email='new_audit_patient@example.com', password='password', role=UserRole.PATIENT
        )
        # The Patient profile is created by a signal in users.models or patients.models
        # We check if that creation was logged.
        created_patient_profile = Patient.objects.get(user=new_patient_user)

        log_entry = AuditLogEntry.objects.filter(
            target_content_type=ContentType.objects.get_for_model(Patient),
            target_object_id=str(created_patient_profile.pk), # Ensure PK is string
            action=AuditLogAction.CREATED
        ).first()
        self.assertIsNotNone(log_entry, "Audit log for Patient creation not found.")
        self.assertEqual(log_entry.user, self.user) # Assuming self.user is the one "performing" the action via mocks

    @patch('audit_log.signals.get_current_user')
    @patch('audit_log.signals.get_current_request')
    def test_model_post_save_update_signal(self, mock_get_request, mock_get_user):
        """Test audit log creation when an audited model instance is updated."""
        mock_request = self.factory.get('/')
        mock_request.user = self.user
        mock_get_request.return_value = mock_request
        mock_get_user.return_value = self.user

        self.patient_profile.address = "Updated Address 123"
        self.patient_profile.save(update_fields=['address']) # Specify update_fields

        log_entry = AuditLogEntry.objects.filter(
            target_content_type=ContentType.objects.get_for_model(Patient),
            target_object_id=str(self.patient_profile.pk),
            action=AuditLogAction.UPDATED
        ).order_by('-timestamp').first() # Get the latest
        
        self.assertIsNotNone(log_entry, "Audit log for Patient update not found.")
        self.assertEqual(log_entry.user, self.user)
        self.assertIn('address', log_entry.additional_info.get('changed_fields', []))


    @patch('audit_log.signals.get_current_user')
    @patch('audit_log.signals.get_current_request')
    def test_model_pre_delete_signal(self, mock_get_request, mock_get_user):
        """Test audit log creation before an audited model instance is deleted."""
        mock_request = self.factory.get('/')
        mock_request.user = self.user # User performing the delete
        mock_get_request.return_value = mock_request
        mock_get_user.return_value = self.user

        patient_to_delete_user = UserModel.objects.create_user(
            username='patient_to_delete', email='patient_to_delete@example.com', password='password', role=UserRole.PATIENT
        )
        patient_to_delete_profile = Patient.objects.get(user=patient_to_delete_user)
        patient_pk_str = str(patient_to_delete_profile.pk) # Get PK before deletion
        
        patient_to_delete_profile.delete() # This will trigger CustomUser delete due to OneToOne cascade

        log_entry_patient = AuditLogEntry.objects.filter(
            target_content_type=ContentType.objects.get_for_model(Patient),
            target_object_id=patient_pk_str,
            action=AuditLogAction.DELETED
        ).first()
        self.assertIsNotNone(log_entry_patient, "Audit log for Patient deletion not found.")
        self.assertEqual(log_entry_patient.user, self.user) # User who initiated deletion

        # Also check for CustomUser deletion log if CustomUser is in AUDITED_MODELS_CRUD
        log_entry_user = AuditLogEntry.objects.filter(
            target_content_type=ContentType.objects.get_for_model(UserModel),
            target_object_id=str(patient_to_delete_user.pk),
            action=AuditLogAction.DELETED
        ).first()
        self.assertIsNotNone(log_entry_user, "Audit log for CustomUser deletion not found.")


class AuditLogHelperFunctionTests(TestCase):
    """Tests for the create_audit_log_entry helper function."""
    def setUp(self):
        self.user = UserModel.objects.create_user(
            username='helper_user_audit', email='helper_audit@example.com', password='password', role=UserRole.ADMIN
        )
        self.patient_profile = Patient.objects.create(user=self.user) # User is also a patient for this test

    def test_create_audit_log_entry_with_target_object(self):
        create_audit_log_entry(
            user=self.user,
            action=AuditLogAction.UPDATED,
            target_object=self.patient_profile,
            details="Patient profile was updated via helper.",
            ip_address="127.0.0.1",
            user_agent="TestHelperAgent"
        )
        log_entry = AuditLogEntry.objects.latest('timestamp')
        self.assertEqual(log_entry.user, self.user)
        self.assertEqual(log_entry.action, AuditLogAction.UPDATED.value)
        self.assertEqual(log_entry.target_object, self.patient_profile)
        self.assertIn(str(self.patient_profile.pk), log_entry.target_object_repr)
        self.assertEqual(log_entry.details, "Patient profile was updated via helper.")

    def test_create_audit_log_entry_without_user_or_target(self):
        create_audit_log_entry(
            user=None,
            action=AuditLogAction.SYSTEM_EVENT,
            details="System maintenance task executed.",
            additional_info={'task_name': 'cleanup_temp_files'}
        )
        log_entry = AuditLogEntry.objects.latest('timestamp')
        self.assertIsNone(log_entry.user)
        self.assertEqual(log_entry.action, AuditLogAction.SYSTEM_EVENT.value)
        self.assertIsNone(log_entry.target_content_type)
        self.assertIsNone(log_entry.target_object_id)
        self.assertEqual(log_entry.additional_info['task_name'], 'cleanup_temp_files')

    def test_create_audit_log_entry_with_deleted_target_info(self):
        ct = ContentType.objects.get_for_model(Patient)
        deleted_patient_pk = "some-deleted-pk" # Example non-integer PK
        deleted_patient_repr = "Deleted Patient Profile 'Old Name' (ID: some-deleted-pk)"
        create_audit_log_entry(
            user=self.user,
            action=AuditLogAction.DELETED,
            target_content_type=ct,
            target_object_id=deleted_patient_pk,
            target_object_repr=deleted_patient_repr,
            details="A patient was deleted."
        )
        log_entry = AuditLogEntry.objects.latest('timestamp')
        self.assertEqual(log_entry.target_content_type, ct)
        self.assertEqual(log_entry.target_object_id, deleted_patient_pk)
        self.assertEqual(log_entry.target_object_repr, deleted_patient_repr)
        self.assertIsNone(log_entry.target_object) # Target object should be None
