# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html

from .models import (
    CustomUser, UserRole,
    DoctorProfile, NurseProfile, ReceptionistProfile, HospitalAdministratorProfile
)
from .forms import CustomUserCreationForm, CustomUserChangeForm
from patients.models import Patient # For PatientProfileInline (if desired)

# Inline for Patient Profile (if managing basic patient info directly under user)
# Note: Patient model itself is more comprehensive and has its own admin.
# This inline would be for a simplified, directly linked PatientProfile if it existed separately.
# Since Patient model uses User as PK, this specific inline isn't typical for that setup.
# class PatientProfileInline(admin.StackedInline):
# model = Patient # This would cause issues as Patient's PK is User.
# can_delete = False
# verbose_name_plural = _('Patient Profile (Basic)')
# fk_name = 'user'
# fields = ('date_of_birth', 'gender', 'phone_number') # Example fields

class DoctorProfileInline(admin.StackedInline):
    model = DoctorProfile
    can_delete = False
    verbose_name_plural = _('Doctor Profile')
    fk_name = 'user'
    fields = ('specialization', 'license_number')
    min_num = 0 # Allow no profile if role is changed away from Doctor before saving
    max_num = 1

class NurseProfileInline(admin.StackedInline):
    model = NurseProfile
    can_delete = False
    verbose_name_plural = _('Nurse Profile')
    fk_name = 'user'
    fields = ('department',)
    min_num = 0
    max_num = 1

class ReceptionistProfileInline(admin.StackedInline):
    model = ReceptionistProfile
    can_delete = False
    verbose_name_plural = _('Receptionist Profile')
    fk_name = 'user'
    # Add fields here if ReceptionistProfile has any specific attributes
    # fields = ('desk_number', 'shift_preference') # Example
    min_num = 0
    max_num = 1

class HospitalAdministratorProfileInline(admin.StackedInline):
    model = HospitalAdministratorProfile
    can_delete = False
    verbose_name_plural = _('Hospital Administrator Profile')
    fk_name = 'user'
    # Add fields here if HospitalAdministratorProfile has any specific attributes
    # fields = ('office_location', 'years_of_experience') # Example
    min_num = 0
    max_num = 1

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    """
    Admin interface configuration for the CustomUser model.
    Extends Django's BaseUserAdmin to include custom fields like 'role'.
    """
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    model = CustomUser

    list_display = ['email', 'username', 'first_name', 'last_name', 'role_display', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['role', 'is_staff', 'is_superuser', 'is_active', 'groups']
    search_fields = ['email__icontains', 'username__icontains', 'first_name__icontains', 'last_name__icontains']
    ordering = ['email']

    # Fieldsets for the change form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'username')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Role Information'), {'fields': ('role',)}),
    )
    # Fieldsets for the add form (used by add_form)
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (_('Role, Email & Name'), {'fields': ('role', 'email', 'first_name', 'last_name', 'username')}),
    )
    # Ensure 'username' is in add_fieldsets if it's required or part of add_form.
    # BaseUserAdmin.add_fieldsets usually includes ('username', 'password', 'password2')

    # Inlines are dynamically determined by get_inlines based on user role
    inlines = []

    def role_display(self, obj):
        return obj.get_role_display()
    role_display.short_description = _('Role')
    role_display.admin_order_field = 'role'

    def get_inlines(self, request, obj=None):
        """
        Dynamically returns inlines based on the user's role.
        This ensures that only relevant profile inlines are shown.
        """
        if obj: # Only show inlines for existing users on the change page.
            if obj.role == UserRole.DOCTOR:
                return [DoctorProfileInline]
            elif obj.role == UserRole.NURSE:
                return [NurseProfileInline]
            elif obj.role == UserRole.RECEPTIONIST:
                return [ReceptionistProfileInline]
            elif obj.role == UserRole.ADMIN:
                return [HospitalAdministratorProfileInline]
            # If Patient role had a separate profile model (not Patient model itself):
            # elif obj.role == UserRole.PATIENT:
            # return [PatientProfileInline] # Assuming PatientProfileInline is defined
        return []

    def save_model(self, request, obj, form, change):
        """
        Handles saving the CustomUser model and its related profile.
        Ensures role-specific profiles are created/updated.
        """
        super().save_model(request, obj, form, change)
        # Signals in models.py (create_or_update_role_specific_profile)
        # handle the creation/update of role-specific profiles.
        # If Patient model (which uses User as PK) needs fields updated here,
        # that would be different logic.

    def get_queryset(self, request):
        # Optimize by prefetching related profiles if they are frequently accessed
        # This depends on how often these profiles are needed in list/detail views.
        return super().get_queryset(request).prefetch_related(
            'doctor_profile', 'nurse_profile',
            'receptionist_profile', 'admin_profile',
            'patient_profile' # This is the Patient model itself
        )

# Admin registration for Profile models (optional, if direct management is needed)
# These are usually managed via inlines in CustomUserAdmin.
@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user_email_link_display', 'specialization', 'license_number')
    search_fields = ('user__email__icontains', 'user__username__icontains', 'specialization__icontains', 'license_number__icontains')
    autocomplete_fields = ['user']
    list_select_related = ['user']

    def user_email_link_display(self, obj):
        link = reverse("admin:users_customuser_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', link, obj.user.email)
    user_email_link_display.short_description = _('Doctor Email')
    user_email_link_display.admin_order_field = 'user__email'

@admin.register(NurseProfile)
class NurseProfileAdmin(admin.ModelAdmin):
    list_display = ('user_email_link_display', 'department')
    search_fields = ('user__email__icontains', 'user__username__icontains', 'department__icontains')
    autocomplete_fields = ['user']
    list_select_related = ['user']

    def user_email_link_display(self, obj):
        link = reverse("admin:users_customuser_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', link, obj.user.email)
    user_email_link_display.short_description = _('Nurse Email')
    user_email_link_display.admin_order_field = 'user__email'

@admin.register(ReceptionistProfile)
class ReceptionistProfileAdmin(admin.ModelAdmin):
    list_display = ('user_email_link_display',) # Add more fields if they exist
    search_fields = ('user__email__icontains', 'user__username__icontains')
    autocomplete_fields = ['user']
    list_select_related = ['user']

    def user_email_link_display(self, obj):
        link = reverse("admin:users_customuser_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', link, obj.user.email)
    user_email_link_display.short_description = _('Receptionist Email')
    user_email_link_display.admin_order_field = 'user__email'

@admin.register(HospitalAdministratorProfile)
class HospitalAdministratorProfileAdmin(admin.ModelAdmin):
    list_display = ('user_email_link_display',) # Add more fields if they exist
    search_fields = ('user__email__icontains', 'user__username__icontains')
    autocomplete_fields = ['user']
    list_select_related = ['user']

    def user_email_link_display(self, obj):
        link = reverse("admin:users_customuser_change", args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', link, obj.user.email)
    user_email_link_display.short_description = _('Admin Email')
    user_email_link_display.admin_order_field = 'user__email'
