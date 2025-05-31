# billing/tests.py
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from users.models import UserRole
from patients.models import Patient
from appointments.models import Appointment, AppointmentStatus as ApptStatus, AppointmentType
from .models import Invoice, InvoiceItem, Payment, InvoiceStatus, PaymentMethod
from audit_log.models import AuditLogEntry, AuditLogAction


UserModel = get_user_model()

class BillingAPITests(TestCase):
    """
    Test suite for the Billing API endpoints (Invoices and Payments).
    """
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin_user = UserModel.objects.create_superuser(
            username='bill_admin_test', email='bill_admin_test@example.com',
            password='StrongPassword123!', role=UserRole.ADMIN
        )
        self.receptionist_user = UserModel.objects.create_user(
            username='bill_receptionist_test', email='bill_receptionist_test@example.com',
            password='StrongPassword123!', role=UserRole.RECEPTIONIST
        )
        self.patient_user = UserModel.objects.create_user(
            username='bill_patient_test', email='bill_patient_test@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="Bill", last_name="Patient"
        )
        self.patient_profile = Patient.objects.get(user=self.patient_user)

        self.doctor_user = UserModel.objects.create_user(
            username='bill_doctor_test', email='bill_doctor_test@example.com',
            password='StrongPassword123!', role=UserRole.DOCTOR
        )
        
        self.other_patient_user = UserModel.objects.create_user(
            username='other_bill_patient', email='other_bill_patient@example.com',
            password='StrongPassword123!', role=UserRole.PATIENT, first_name="OtherBill", last_name="Patient"
        )
        self.other_patient_profile = Patient.objects.get(user=self.other_patient_user)


        # Sample Appointment for linking to invoice items
        self.sample_appointment = Appointment.objects.create(
            patient=self.patient_profile, doctor=self.doctor_user,
            appointment_type=AppointmentType.GENERAL_CONSULTATION,
            appointment_date_time=timezone.now() - timedelta(days=1), # Past appointment
            status=ApptStatus.COMPLETED, scheduled_by=self.receptionist_user
        )

        # URLs
        self.invoice_list_create_url = reverse('billing:invoice-list-create')
        self.invoice_detail_url = lambda pk: reverse('billing:invoice-detail', kwargs={'id': pk})
        self.payment_list_create_url = lambda invoice_id: reverse('billing:invoice-payment-list-create', kwargs={'invoice_id': invoice_id})
        self.payment_detail_url = lambda invoice_id, payment_id: reverse('billing:invoice-payment-detail', kwargs={'invoice_id': invoice_id, 'payment_id': payment_id})

        # Common Invoice Data
        self.invoice_data = {
            'patient': self.patient_profile.pk,
            'issue_date': date.today().isoformat(),
            'due_date': (date.today() + timedelta(days=30)).isoformat(),
            'status': InvoiceStatus.DRAFT, # Start as DRAFT
            'items': [
                {'description': 'Consultation Fee', 'quantity': 1, 'unit_price': '150.00', 'appointment': self.sample_appointment.pk},
                {'description': 'Medication XYZ', 'quantity': 2, 'unit_price': '25.50'} # Total 51.00
            ] # Total: 150.00 + 51.00 = 201.00
        }

    def _login_user(self, user):
        self.client.force_authenticate(user=user)

    # --- Invoice Tests ---
    def test_create_invoice_as_receptionist(self):
        self._login_user(self.receptionist_user)
        response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Invoice.objects.count(), 1)
        invoice = Invoice.objects.first()
        self.assertEqual(invoice.patient, self.patient_profile)
        self.assertEqual(invoice.items.count(), 2)
        self.assertEqual(invoice.created_by, self.receptionist_user)
        self.assertEqual(invoice.total_amount, Decimal('201.00'))
        self.assertEqual(invoice.status, InvoiceStatus.DRAFT) # As per data
        # Check audit log for invoice creation
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(invoice.id), action=AuditLogAction.CREATED, user=self.receptionist_user
        ).exists())


    def test_create_invoice_as_patient_forbidden(self):
        self._login_user(self.patient_user)
        response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.content)

    def test_list_invoices_as_admin(self):
        self.test_create_invoice_as_receptionist() # Create one invoice
        self._login_user(self.admin_user)
        response = self.client.get(self.invoice_list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_invoices_as_patient_sees_own(self):
        self.test_create_invoice_as_receptionist() # Creates an invoice for self.patient_profile
        # Create invoice for another patient
        Invoice.objects.create(
            patient=self.other_patient_profile, issue_date=date.today(),
            due_date=date.today() + timedelta(days=15), status=InvoiceStatus.SENT,
            created_by=self.admin_user
        )
        self.assertEqual(Invoice.objects.count(), 2)

        self._login_user(self.patient_user)
        response = self.client.get(self.invoice_list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['patient_details']['user']['id'], self.patient_user.id)

    def test_retrieve_invoice_as_owner_patient(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = create_response.data['id']

        self._login_user(self.patient_user)
        response = self.client.get(self.invoice_detail_url(invoice_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], invoice_id)

    def test_update_invoice_status_as_receptionist(self):
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = create_response.data['id']

        update_data = {'status': InvoiceStatus.SENT, 'notes': 'Invoice sent to patient.'}
        response = self.client.patch(self.invoice_detail_url(invoice_id), update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        self.assertEqual(response.data['status'], InvoiceStatus.SENT)
        self.assertEqual(response.data['notes'], 'Invoice sent to patient.')
        # Check audit log for invoice update
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(invoice_id), action=AuditLogAction.UPDATED, user=self.receptionist_user
        ).exists())


    def test_void_invoice_as_admin(self): # "Delete" for admin should void
        self._login_user(self.receptionist_user)
        create_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = create_response.data['id']
        Invoice.objects.filter(id=invoice_id).update(status=InvoiceStatus.SENT) # Mark as SENT first

        self._login_user(self.admin_user)
        response = self.client.delete(self.invoice_detail_url(invoice_id)) # DELETE should trigger voiding
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content) # View returns 200 OK with voided data
        self.assertEqual(response.data['status'], InvoiceStatus.VOID)
        updated_invoice = Invoice.objects.get(id=invoice_id)
        self.assertEqual(updated_invoice.status, InvoiceStatus.VOID)
        # Check audit log for invoice void (which is an update)
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(invoice_id), action=AuditLogAction.INVOICE_VOIDED, user=self.admin_user
        ).exists())

    # --- Payment Tests ---
    def test_create_payment_as_receptionist(self):
        self._login_user(self.receptionist_user)
        invoice_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = invoice_response.data['id']
        # Change invoice status to SENT to allow payments
        Invoice.objects.filter(pk=invoice_id).update(status=InvoiceStatus.SENT)
        invoice = Invoice.objects.get(pk=invoice_id) # Refresh instance

        payment_data = {
            'invoice': invoice_id, 'amount': '100.00',
            'payment_method': PaymentMethod.CASH, 'payment_date': timezone.now().isoformat()
        }
        response = self.client.post(self.payment_list_create_url(invoice_id), payment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertEqual(Payment.objects.count(), 1)
        payment = Payment.objects.first()
        self.assertEqual(payment.amount, Decimal('100.00'))
        self.assertEqual(payment.recorded_by, self.receptionist_user)

        invoice.refresh_from_db() # Refresh to get updated totals from signals
        self.assertEqual(invoice.paid_amount, Decimal('100.00'))
        self.assertEqual(invoice.status, InvoiceStatus.PARTIALLY_PAID) # 100 paid of 201 total
        # Check audit log for payment creation
        self.assertTrue(AuditLogEntry.objects.filter(
            target_object_id=str(payment.id), action=AuditLogAction.CREATED, user=self.receptionist_user
        ).exists())


    def test_list_payments_for_invoice_as_patient(self):
        self.test_create_payment_as_receptionist() # Creates invoice and one payment
        invoice_id = Invoice.objects.first().id

        self._login_user(self.patient_user)
        response = self.client.get(self.payment_list_create_url(invoice_id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(Decimal(response.data['results'][0]['amount']), Decimal('100.00'))

    def test_cannot_pay_voided_invoice(self):
        self._login_user(self.receptionist_user)
        invoice_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = invoice_response.data['id']

        self._login_user(self.admin_user) # Admin voids the invoice
        self.client.delete(self.invoice_detail_url(invoice_id)) # This sets status to VOID

        self._login_user(self.receptionist_user) # Receptionist tries to add payment
        payment_data = {'invoice': invoice_id, 'amount': '50.00', 'payment_method': PaymentMethod.CASH}
        response = self.client.post(self.payment_list_create_url(invoice_id), payment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        self.assertIn("voided invoice", str(response.data).lower())

    def test_overpayment_prevention_on_create(self):
        self._login_user(self.receptionist_user)
        invoice_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = invoice_response.data['id']
        Invoice.objects.filter(pk=invoice_id).update(status=InvoiceStatus.SENT)
        invoice = Invoice.objects.get(pk=invoice_id)

        overpayment_data = {
            'invoice': invoice_id, 'amount': '300.00', # Invoice total is 201.00
            'payment_method': PaymentMethod.CASH, 'payment_date': timezone.now().isoformat()
        }
        response = self.client.post(self.payment_list_create_url(invoice_id), overpayment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, response.content)
        self.assertIn("exceeds amount due", str(response.data).lower())

    def test_full_payment_updates_invoice_status_to_paid(self):
        self._login_user(self.receptionist_user)
        invoice_response = self.client.post(self.invoice_list_create_url, self.invoice_data, format='json')
        invoice_id = invoice_response.data['id']
        Invoice.objects.filter(pk=invoice_id).update(status=InvoiceStatus.SENT)
        invoice = Invoice.objects.get(pk=invoice_id)

        payment_data = {
            'invoice': invoice_id, 'amount': invoice.total_amount, # Pay exact total
            'payment_method': PaymentMethod.CREDIT_CARD, 'payment_date': timezone.now().isoformat()
        }
        response = self.client.post(self.payment_list_create_url(invoice_id), payment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, invoice.total_amount)
        self.assertEqual(invoice.status, InvoiceStatus.PAID)
