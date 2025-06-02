import random
from datetime import timedelta, date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.conf import settings

# HMS App Models
from users.models import (
    CustomUser, UserRole,
    DoctorProfile, NurseProfile, ReceptionistProfile, HospitalAdministratorProfile
)
from patients.models import Patient, MedicalRecord, Gender
from appointments.models import Appointment, AppointmentStatus, AppointmentType
from medical_management.models import Prescription, Treatment, Observation
from billing.models import Invoice, InvoiceItem, Payment, InvoiceStatus as BillingInvoiceStatus, PaymentMethod as BillingPaymentMethod
# Inquiries and Telemedicine might be seeded if complex initial data is needed,
# but for a basic seed, focusing on core patient-doctor interactions.
# from inquiries.models import Inquiry, InquiryStatus as InquiryInqStatus, InquirySource
# from telemedicine.models import TelemedicineSession, TelemedicineSessionStatus as TelemedicineSessStatus

# Audit log is typically not seeded directly with historical data unless for testing specific audit scenarios.

User = get_user_model()

DEFAULT_PASSWORD = getattr(settings, 'SEED_DEFAULT_PASSWORD', "PasswordHMS123!")

class Command(BaseCommand):
    help = 'Clears relevant HMS data from the database and seeds it with initial data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-clear',
            action='store_true',
            help='Skip the database clearing step and only seed data.',
        )
        parser.add_argument(
            '--clear-only',
            action='store_true',
            help='Only clear the database and do not seed any data.',
        )
        parser.add_argument(
            '--skip-billing',
            action='store_true',
            help='Skip seeding billing data (invoices, payments).',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        no_clear = options['no_clear']
        clear_only = options['clear_only']
        skip_billing = options['skip_billing']

        if not no_clear:
            self.stdout.write(self.style.WARNING(
                "Clearing relevant HMS data from the database... (Users with is_superuser=True may be preserved by flush)"))
            try:
                # More targeted deletion might be preferred over flush in a complex system.
                # Flush will empty ALL tables.
                # For now, using flush as per original script's intent.
                # Consider preserving superusers if flush is too destructive.
                call_command('flush', '--noinput')
                self.stdout.write(self.style.SUCCESS(
                    "Database cleared successfully (or attempted via flush)."))
            except Exception as e:
                self.stderr.write(self.style.ERROR(
                    f"Error clearing database: {e}"))
                # Consider whether to proceed if clearing fails. For a seed script, it might be okay.
                # return # Uncomment to stop if clearing fails

        if clear_only:
            self.stdout.write(self.style.SUCCESS(
                "Database cleared (or flush attempted). No data will be seeded as per --clear-only flag."))
            return

        self.stdout.write(self.style.HTTP_INFO(
            "Seeding HMS database with initial data..."))

        self._seed_users_and_profiles()
        self._seed_appointments_medical_records()
        if not skip_billing:
            self._seed_billing_data()
        # Add calls to other seed methods here if developed (e.g., inquiries, telemedicine)

        self.stdout.write(self.style.SUCCESS(
            "HMS Database seeding completed successfully!"))

    def _create_user_if_not_exists(self, email, defaults, password=DEFAULT_PASSWORD):
        """
        Helper to create a CustomUser if one with the given email doesn't exist.
        Updates the user with defaults if they do exist.
        """
        try:
            user = User.objects.get(email=email)
            created = False
            # Update existing user with defaults (excluding password)
            for key, value in defaults.items():
                setattr(user, key, value)
            user.save()
        except User.DoesNotExist:
            # Ensure username is provided or generated if your CustomUserManager expects it
            username = defaults.pop('username', email.split('@')[0]) # Simple username generation
            user = User.objects.create_user(
                email=email,
                username=username, # Add username
                password=password,
                **defaults
            )
            created = True
        return user, created

    def _seed_users_and_profiles(self):
        self.stdout.write(self.style.HTTP_INFO("  Seeding Users and Profiles..."))

        # Hospital Administrator (Superuser)
        admin_defaults = {
            "first_name": "Adara", "last_name": "Min",
            "role": UserRole.ADMIN, "is_staff": True, "is_superuser": True,
            "username": "hms_admin"
        }
        admin_user, created_admin = self._create_user_if_not_exists(
            "admin@hms.example.com", admin_defaults)
        if created_admin: # Profile signal should handle this, but ensure if needed
            HospitalAdministratorProfile.objects.get_or_create(user=admin_user)
        self.stdout.write(self.style.SUCCESS(
            f"    Admin user '{admin_user.email}' {'created' if created_admin else 'found/updated'}."))

        # Doctors
        doctors_data = [
            {"email": "dr.alice.smith@hms.example.com", "first_name": "Alice", "last_name": "Smith", "username": "dr_asmith",
             "profile_attrs": {"specialization": "Cardiology", "license_number": "DOC001"}},
            {"email": "dr.bob.jones@hms.example.com", "first_name": "Bob", "last_name": "Jones", "username": "dr_bjones",
             "profile_attrs": {"specialization": "Pediatrics", "license_number": "DOC002"}},
            {"email": "dr.carla.day@hms.example.com", "first_name": "Carla", "last_name": "Day", "username": "dr_cday",
             "profile_attrs": {"specialization": "General Medicine", "license_number": "DOC003"}},
        ]
        for data in doctors_data:
            user_defaults = {
                "first_name": data["first_name"], "last_name": data["last_name"],
                "role": UserRole.DOCTOR, "is_staff": True, "username": data["username"]
            }
            doctor_user, created = self._create_user_if_not_exists(data["email"], user_defaults)
            if doctor_user: # Ensure user was created or fetched
                DoctorProfile.objects.update_or_create(user=doctor_user, defaults=data["profile_attrs"])
        self.stdout.write(self.style.SUCCESS(f"    {len(doctors_data)} Doctor users and profiles seeded/updated."))

        # Nurses
        nurses_data = [
            {"email": "nurse.david.green@hms.example.com", "first_name": "David", "last_name": "Green", "username": "nurse_dgreen",
             "profile_attrs": {"department": "Cardiology"}},
            {"email": "nurse.emily.white@hms.example.com", "first_name": "Emily", "last_name": "White", "username": "nurse_ewhite",
             "profile_attrs": {"department": "Pediatrics"}},
        ]
        for data in nurses_data:
            user_defaults = {
                "first_name": data["first_name"], "last_name": data["last_name"],
                "role": UserRole.NURSE, "is_staff": True, "username": data["username"]
            }
            nurse_user, created = self._create_user_if_not_exists(data["email"], user_defaults)
            if nurse_user:
                NurseProfile.objects.update_or_create(user=nurse_user, defaults=data["profile_attrs"])
        self.stdout.write(self.style.SUCCESS(f"    {len(nurses_data)} Nurse users and profiles seeded/updated."))

        # Receptionists
        receptionists_data = [
            {"email": "recep.frank.brown@hms.example.com", "first_name": "Frank", "last_name": "Brown", "username": "recep_fbrown"},
        ]
        for data in receptionists_data:
            user_defaults = {
                "first_name": data["first_name"], "last_name": data["last_name"],
                "role": UserRole.RECEPTIONIST, "is_staff": True, "username": data["username"]
            }
            recep_user, created = self._create_user_if_not_exists(data["email"], user_defaults)
            if recep_user:
                ReceptionistProfile.objects.get_or_create(user=recep_user)
        self.stdout.write(self.style.SUCCESS(f"    {len(receptionists_data)} Receptionist users and profiles seeded/updated."))

        # Patients
        patients_data = [
            {"email": "patient.gary.hall@hms.example.com", "first_name": "Gary", "last_name": "Hall", "username": "pat_ghall",
             "profile_attrs": {"date_of_birth": date(1985, 5, 15), "gender": Gender.MALE, "phone_number": "0821112233", "address": "123 Oak St"}},
            {"email": "patient.helen.king@hms.example.com", "first_name": "Helen", "last_name": "King", "username": "pat_hking",
             "profile_attrs": {"date_of_birth": date(1992, 8, 22), "gender": Gender.FEMALE, "phone_number": "0834445566", "address": "456 Pine Ave"}},
        ]
        for data in patients_data:
            user_defaults = {
                "first_name": data["first_name"], "last_name": data["last_name"],
                "role": UserRole.PATIENT, "username": data["username"]
            }
            patient_user, created = self._create_user_if_not_exists(data["email"], user_defaults)
            if patient_user: # Patient profile is created by signal on CustomUser save
                # We can update it here if signal doesn't cover all fields or for explicitness
                patient_profile, _ = Patient.objects.get_or_create(user=patient_user)
                for attr, value in data["profile_attrs"].items():
                    setattr(patient_profile, attr, value)
                patient_profile.save()
        self.stdout.write(self.style.SUCCESS(f"    {len(patients_data)} Patient users and profiles seeded/updated."))

    def _seed_appointments_medical_records(self):
        self.stdout.write(self.style.HTTP_INFO("  Seeding Appointments and Medical Records..."))

        try:
            dr_smith = User.objects.get(email="dr.alice.smith@hms.example.com")
            dr_jones = User.objects.get(email="dr.bob.jones@hms.example.com")
            nurse_green = User.objects.get(email="nurse.david.green@hms.example.com")

            patient_gary_user = User.objects.get(email="patient.gary.hall@hms.example.com")
            patient_gary = Patient.objects.get(user=patient_gary_user)
            patient_helen_user = User.objects.get(email="patient.helen.king@hms.example.com")
            patient_helen = Patient.objects.get(user=patient_helen_user)
            
            admin_user = User.objects.get(email="admin@hms.example.com") # Fallback scheduler

        except User.DoesNotExist as e:
            self.stderr.write(self.style.ERROR(f"    Could not find a required user for seeding appointments: {e}"))
            return
        except Patient.DoesNotExist as e:
            self.stderr.write(self.style.ERROR(f"    Could not find a required patient profile for seeding appointments: {e}"))
            return

        # Appointment 1 (Past, Completed) for Gary with Dr. Smith
        now = timezone.now()
        appt1_dt = now - timedelta(days=7, hours=2)
        appt1, created_appt1 = Appointment.objects.get_or_create(
            patient=patient_gary,
            doctor=dr_smith,
            appointment_date_time=appt1_dt,
            defaults={
                "appointment_type": AppointmentType.GENERAL_CONSULTATION,
                "status": AppointmentStatus.COMPLETED,
                "reason": "Annual check-up and flu-like symptoms.",
                "scheduled_by": admin_user, # or a receptionist
                "estimated_duration_minutes": 30
            }
        )
        if created_appt1:
            mr1, _ = MedicalRecord.objects.get_or_create(
                patient=patient_gary, record_date=appt1_dt, created_by=dr_smith,
                defaults={
                    "diagnosis": "Seasonal Influenza",
                    "symptoms": "Fever, cough, fatigue for 3 days.",
                    "treatment_plan": "Rest, hydration, Paracetamol for fever.",
                    "notes": "Advised to return if symptoms worsen or persist beyond 5-7 days."
                }
            )
            Prescription.objects.get_or_create(
                patient=patient_gary, prescribed_by=dr_smith, medical_record=mr1, appointment=appt1,
                medication_name="Paracetamol 500mg", dosage="2 tablets", frequency="Every 6 hours as needed for fever",
                duration_days=5, instructions="Do not exceed 8 tablets in 24 hours.", prescription_date=appt1_dt.date()
            )
            Treatment.objects.get_or_create(
                patient=patient_gary, administered_by=nurse_green, medical_record=mr1, appointment=appt1,
                treatment_name="Flu Shot Administration (Preventative)", treatment_date_time=appt1_dt - timedelta(days=30), # Assuming flu shot was earlier
                description="Administered seasonal flu vaccine.", outcome="Patient tolerated well."
            )

        # Appointment 2 (Future, Confirmed) for Helen with Dr. Jones
        appt2_dt = now + timedelta(days=5, hours=3)
        Appointment.objects.get_or_create(
            patient=patient_helen,
            doctor=dr_jones,
            appointment_date_time=appt2_dt,
            defaults={
                "appointment_type": AppointmentType.SPECIALIST_VISIT,
                "status": AppointmentStatus.CONFIRMED,
                "reason": "Follow-up for pediatric consultation.",
                "scheduled_by": admin_user,
                "estimated_duration_minutes": 45
            }
        )
        Observation.objects.get_or_create( # Observation for Helen, perhaps from a previous visit
            patient=patient_helen, observed_by=nurse_green, observation_date_time=now - timedelta(days=10),
            defaults={
                "symptoms_observed": "Mild rash on arms.",
                "vital_signs": {"temperature": "36.8C", "heart_rate": "80bpm"},
                "description": "Patient seemed comfortable, rash non-itchy.",
            }
        )
        self.stdout.write(self.style.SUCCESS("    Sample appointments and medical records seeded."))

    def _seed_billing_data(self):
        self.stdout.write(self.style.HTTP_INFO("  Seeding Billing Data (Invoices and Payments)..."))
        try:
            patient_gary = Patient.objects.get(user__email="patient.gary.hall@hms.example.com")
            admin_user = User.objects.get(email="admin@hms.example.com") # Used as created_by for invoice
            receptionist_user = User.objects.get(email="recep.frank.brown@hms.example.com") # Used as recorded_by for payment
            
            # Find the completed appointment for Gary
            completed_appointment_gary = Appointment.objects.filter(
                patient=patient_gary, 
                status=AppointmentStatus.COMPLETED
            ).first()

            if not completed_appointment_gary:
                self.stdout.write(self.style.WARNING("    Skipping billing seed: No completed appointment found for Gary Hall to bill against."))
                return

        except (Patient.DoesNotExist, User.DoesNotExist) as e:
            self.stderr.write(self.style.ERROR(f"    Could not find required user/patient for billing seed: {e}"))
            return

        # Invoice for Gary's completed appointment
        invoice1_data = {
            "patient": patient_gary,
            "issue_date": completed_appointment_gary.appointment_date_time.date(),
            "due_date": completed_appointment_gary.appointment_date_time.date() + timedelta(days=30),
            "created_by": admin_user,
            "status": BillingInvoiceStatus.SENT # Initial status
        }
        invoice1, created_inv1 = Invoice.objects.get_or_create(
            patient=patient_gary, 
            # Add a more specific filter if multiple invoices per patient are possible for same day
            # For simplicity, this assumes one main invoice for this seeded appointment
            defaults=invoice1_data
        )
        
        if created_inv1: # Only add items if invoice is newly created by seeder
            InvoiceItem.objects.create(
                invoice=invoice1, description="Consultation Fee - Dr. Smith", quantity=1, unit_price=Decimal("500.00"),
                appointment=completed_appointment_gary
            )
            InvoiceItem.objects.create(
                invoice=invoice1, description="Paracetamol 500mg (Prescription)", quantity=1, unit_price=Decimal("50.00")
                # Assuming prescription is linked via MedicalRecord or Appointment, not directly to InvoiceItem in this model
            )
            # Important: After adding items, the totals and status need to be updated.
            # The model's save method or signals should handle this.
            # If not, call it explicitly:
            invoice1.update_invoice_totals_and_status(force_save=True) 
            self.stdout.write(self.style.SUCCESS(f"    Created Invoice {invoice1.invoice_number} for {patient_gary.user.email}"))

            # Add a partial payment for this invoice
            if invoice1.status != BillingInvoiceStatus.PAID and invoice1.amount_due > 0:
                Payment.objects.create(
                    invoice=invoice1,
                    payment_date=timezone.now() - timedelta(days=1),
                    amount=Decimal("250.00"),
                    payment_method=BillingPaymentMethod.CREDIT_CARD,
                    transaction_id="PAYID" + str(random.randint(10000,99999)),
                    recorded_by=receptionist_user,
                    notes="Partial payment made via card."
                )
                # Again, invoice totals and status should update via signals/save
                invoice1.update_invoice_totals_and_status(force_save=True)
                self.stdout.write(self.style.SUCCESS(f"    Added partial payment for Invoice {invoice1.invoice_number}"))
        else:
            self.stdout.write(self.style.WARNING(f"    Invoice for {patient_gary.user.email} (related to appointment on {completed_appointment_gary.appointment_date_time.date()}) already exists. Skipping item/payment creation for it."))

        self.stdout.write(self.style.SUCCESS("    Billing data seeding attempt complete."))

