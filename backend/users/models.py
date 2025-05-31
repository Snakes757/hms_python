# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager as DjangoBaseUserManager
from django.utils.translation import gettext_lazy as _
# Signals are imported in users.signals and connected in users.apps.UsersConfig.ready()

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', _('Hospital Administrator')
    DOCTOR = 'DOCTOR', _('Doctor')
    NURSE = 'NURSE', _('Nurse')
    RECEPTIONIST = 'RECEPTIONIST', _('Receptionist')
    PATIENT = 'PATIENT', _('Patient')
    # Add other roles as needed, e.g., PHARMACIST, LAB_TECHNICIAN

class CustomUserManager(DjangoBaseUserManager):
    """
    Custom user manager where email is the unique identifier for authentication
    instead of username. Username is still present and unique.
    """
    def create_user(self, email, username=None, password=None, **extra_fields):
        """
        Creates and saves a User with the given email, username, and password.
        """
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)

        if not username: # Auto-generate username from email if not provided
            username_base = email.split('@')[0].replace('.', '').replace('-', '') # Basic sanitization
            username_candidate = username_base
            counter = 1
            while self.model.objects.filter(username=username_candidate).exists():
                username_candidate = f"{username_base}{counter}"
                counter += 1
            username = username_candidate
        elif self.model.objects.filter(username=username).exists():
             # If username is provided but exists, append counter to make it unique
            username_base = username
            counter = 1
            while self.model.objects.filter(username=username).exists():
                username = f"{username_base}{counter}"
                counter +=1


        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        # 'role' should be passed in extra_fields or default on model

        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username=None, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email, username, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', UserRole.ADMIN) # Superusers are Admins

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        if extra_fields.get('role') != UserRole.ADMIN:
            # Could allow other roles for superuser, but typically Admin
            pass # raise ValueError(_('Superuser role must be Admin.'))

        return self.create_user(email, username, password, **extra_fields)

class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Uses email as the primary identifier for login (USERNAME_FIELD).
    Includes a 'role' field to define user responsibilities within the system.
    """
    # Username is still present and unique, inherited from AbstractUser.
    # It can be used for display, internal reference, or if legacy systems require it.
    # AbstractUser already defines username, first_name, last_name, is_staff, is_active, date_joined.
    email = models.EmailField(
        _('email address'),
        unique=True, # Email must be unique.
        error_messages={'unique': _("A user with this email address already exists.")}
    )
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
        verbose_name=_("User Role"),
        db_index=True # Index for faster filtering by role
    )
    # Add other common user fields if needed, e.g.:
    # phone_number = models.CharField(max_length=20, blank=True, verbose_name=_("Primary Phone Number"))
    # profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True, verbose_name=_("Profile Picture"))

    USERNAME_FIELD = 'email' # Use email for login.
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name'] # Fields prompted for createsuperuser besides USERNAME_FIELD and password.

    objects = CustomUserManager() # Use the custom manager.

    class Meta:
        verbose_name = _("User Account")
        verbose_name_plural = _("User Accounts")
        ordering = ['last_name', 'first_name', 'email'] # Default ordering

    def __str__(self):
        return f"{self.full_name_display} ({self.email}) - {self.get_role_display()}"

    @property
    def full_name_display(self): # Renamed from full_name to avoid conflict if AbstractUser's full_name is used.
        """Returns the user's full name, or email if names are not set."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.username or self.email # Fallback to username then email
    full_name_display.fget.short_description = _("Full Name")


class BaseProfile(models.Model):
    """
    Abstract base model for role-specific user profiles.
    Links one-to-one with the CustomUser model.
    """
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        primary_key=True,
        # related_name is defined in subclasses for clarity, e.g., user.doctor_profile
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Profile Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Profile Updated At"))

    class Meta:
        abstract = True

    def __str__(self):
        return f"Profile for {self.user.email}"

class DoctorProfile(BaseProfile):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name='doctor_profile')
    specialization = models.CharField(max_length=100, blank=True, verbose_name=_("Specialization"))
    license_number = models.CharField(
        max_length=50, unique=True, null=True, blank=True,
        verbose_name=_("Medical License Number"),
        help_text=_("Official medical license number, must be unique if provided.")
    )
    # Add other doctor-specific fields: years_experience, consultation_fee, available_hours, etc.

    class Meta:
        verbose_name = _("Doctor Profile")
        verbose_name_plural = _("Doctor Profiles")

    def __str__(self):
        return f"Doctor Profile: {self.user.full_name_display}"

class NurseProfile(BaseProfile):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name='nurse_profile')
    department = models.CharField(max_length=100, blank=True, verbose_name=_("Department"))
    # Add other nurse-specific fields: certifications, shift, etc.

    class Meta:
        verbose_name = _("Nurse Profile")
        verbose_name_plural = _("Nurse Profiles")

    def __str__(self):
        return f"Nurse Profile: {self.user.full_name_display}"

class ReceptionistProfile(BaseProfile):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name='receptionist_profile')
    # Add receptionist-specific fields: desk_number, languages_spoken, etc.
    # Example: desk_location = models.CharField(max_length=50, blank=True, verbose_name=_("Desk Location"))

    class Meta:
        verbose_name = _("Receptionist Profile")
        verbose_name_plural = _("Receptionist Profiles")

    def __str__(self):
        return f"Receptionist Profile: {self.user.full_name_display}"

class HospitalAdministratorProfile(BaseProfile):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True, related_name='admin_profile') # Changed related_name
    # Add admin-specific fields: office_location, management_level, etc.
    # Example: office_number = models.CharField(max_length=20, blank=True, verbose_name=_("Office Number"))

    class Meta:
        verbose_name = _("Hospital Administrator Profile")
        verbose_name_plural = _("Hospital Administrator Profiles")

    def __str__(self):
        return f"Administrator Profile: {self.user.full_name_display}"

# Signal to create/update role-specific profiles is in users.signals.py
