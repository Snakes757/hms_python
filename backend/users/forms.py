# users/forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm as BaseUserCreationForm, UserChangeForm as BaseUserChangeForm
from django.utils.translation import gettext_lazy as _
from django.db import transaction

from .models import CustomUser, UserRole, DoctorProfile, NurseProfile # Import other profiles if handling them here

class CustomUserCreationForm(BaseUserCreationForm):
    """
    A form for creating new users, including the custom 'role' field.
    Ensures email is unique and sets the role.
    """
    email = forms.EmailField(
        label=_("Email"),
        max_length=254,
        widget=forms.EmailInput(attrs={'autocomplete': 'email', 'required': True}), # Make HTML required
        help_text=_("Required. A valid email address for login and communication.")
    )
    role = forms.ChoiceField(
        choices=UserRole.choices,
        required=True,
        label=_("User Role"),
        help_text=_("Select the primary role for this user within the system.")
    )
    # Add fields for role-specific profiles if they need to be set at user creation time via this form.
    # Example for DoctorProfile:
    # specialization = forms.CharField(max_length=100, required=False, label=_("Specialization (if Doctor)"))
    # license_number = forms.CharField(max_length=50, required=False, label=_("License Number (if Doctor)"))

    class Meta(BaseUserCreationForm.Meta):
        model = CustomUser
        # 'username' is inherited from BaseUserCreationForm.Meta.fields
        # Ensure 'email' is present if it's the USERNAME_FIELD.
        fields = ('username', 'email', 'first_name', 'last_name', 'role')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError(_("A user with this email address already exists."))
        return email

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=False) # Save CustomUser instance first.
        # Ensure email and role from form are used, as super().save() might rely on model defaults or initial data.
        user.email = self.cleaned_data['email']
        user.role = self.cleaned_data['role']

        if commit:
            user.save() # Saves the CustomUser.
            # Signals (users.signals.create_or_update_role_specific_profile and
            # patients.signals.create_or_update_patient_profile_on_user_save)
            # will handle creation of associated profiles (DoctorProfile, Patient, etc.).
            # If profile fields were added to this form, save them here:
            # if user.role == UserRole.DOCTOR:
            #     DoctorProfile.objects.update_or_create(
            #         user=user,
            #         defaults={
            #             'specialization': self.cleaned_data.get('specialization'),
            #             'license_number': self.cleaned_data.get('license_number')
            #         }
            #     )
        return user

class CustomUserChangeForm(BaseUserChangeForm):
    """
    A form for updating existing users, including the custom 'role' field.
    Ensures email uniqueness.
    """
    email = forms.EmailField(
        label=_("Email"),
        max_length=254,
        widget=forms.EmailInput(attrs={'autocomplete': 'email', 'required': True}),
        help_text=_("Required. A valid email address.")
    )
    role = forms.ChoiceField(
        choices=UserRole.choices,
        required=True,
        label=_("User Role"),
        help_text=_("Select the primary role for this user.")
    )
    # Example for DoctorProfile fields on change form:
    # specialization = forms.CharField(max_length=100, required=False, label=_("Specialization (if Doctor)"))
    # license_number = forms.CharField(max_length=50, required=False, label=_("License Number (if Doctor)"))


    class Meta(BaseUserChangeForm.Meta):
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'role',
                  'is_active', 'is_staff', 'is_superuser',
                  'groups', 'user_permissions')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Populate role and other profile fields if instance exists
        if self.instance and self.instance.pk:
            self.fields['role'].initial = self.instance.role
            # if self.instance.role == UserRole.DOCTOR and hasattr(self.instance, 'doctor_profile'):
            #     self.fields['specialization'].initial = self.instance.doctor_profile.specialization
            #     self.fields['license_number'].initial = self.instance.doctor_profile.license_number

    def clean_email(self):
        email = self.cleaned_data.get('email')
        # Check for uniqueness excluding the current instance
        if CustomUser.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError(_("A user with this email address already exists."))
        return email

    @transaction.atomic
    def save(self, commit=True):
        user = super().save(commit=False)
        # Ensure email and role from form are used.
        user.email = self.cleaned_data['email']
        user.role = self.cleaned_data['role']

        if commit:
            user.save()
            # Signals handle profile updates/creation based on role.
            # If profile fields were part of this form, save them:
            # if user.role == UserRole.DOCTOR:
            #     DoctorProfile.objects.update_or_create(
            #         user=user,
            #         defaults={
            #             'specialization': self.cleaned_data.get('specialization'),
            #             'license_number': self.cleaned_data.get('license_number')
            #         }
            #     )
            # elif user.role != UserRole.DOCTOR and hasattr(user, 'doctor_profile'):
            #     # If role changed away from Doctor, consider deleting the DoctorProfile
            #     # user.doctor_profile.delete() # Or handle this via signals
            #     pass

        return user
