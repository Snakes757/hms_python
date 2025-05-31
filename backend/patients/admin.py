# patients/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html

from .models import Patient, MedicalRecord, Gender
from users.models import UserRole, CustomUser
# from appointments.models import Appointment # Not directly used as inline here
# from medical_management.models import Prescription, Treatment, Observation # Not directly used as inline here

class MedicalRecordInline(admin.StackedInline):
    """
    Inline admin configuration for MedicalRecord.
    Allows managing a patient's medical records directly within the Patient admin page.
    """
    model = MedicalRecord
    extra = 0 # No empty forms by default, add as needed
    fields = ('record_date', 'diagnosis', 'symptoms', 'treatment_plan', 'notes', 'created_by_link_display')
    readonly_fields = ('record_date', 'created_by_link_display') # record_date is auto_now_add on model
    autocomplete_fields = ['created_by'] # For selection
    verbose_name = _("Medical Record")
    verbose_name_plural = _("Medical Records")
    ordering = ('-record_date',)
    show_change_link = True # Allows direct navigation to the MedicalRecord change form

    def created_by_link_display(self, obj):
        if obj.created_by:
            link = reverse("admin:users_customuser_change", args=[obj.created_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.created_by.full_name)
        return _("N/A")
    created_by_link_display.short_description = _('Created By')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "created_by":
            kwargs["queryset"] = CustomUser.objects.filter(
                role__in=[UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN], is_active=True
            ).order_by('last_name', 'first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Patient model.
    """
    list_display = (
        'user_full_name_link_display', 'user_email_display', 'date_of_birth',
        'gender_display', 'phone_number_display', 'age_display', 'user_is_active_display'
    )
    search_fields = (
        'user__email__icontains',
        'user__username__icontains',
        'user__first_name__icontains',
        'user__last_name__icontains',
        'phone_number__icontains' # phone_number is now plain text
    )
    list_filter = ('gender', ('user__date_joined', admin.DateFieldListFilter), ('user__is_active', admin.BooleanFieldListFilter))
    ordering = ('user__last_name', 'user__first_name')
    # Note: 'user' is the PK, so it's implicitly read-only after creation.
    # We link to CustomUser admin for user field changes.
    readonly_fields = ('age_display', 'user_account_link_display', 'created_at', 'updated_at')
    autocomplete_fields = ['user'] # For selecting the user when creating a Patient record (if not auto-created by signal)

    fieldsets = (
        (_("User Account Information"), {'fields': ('user_account_link_display', 'user')}),
        (_("Personal Information"), {'fields': (('date_of_birth', 'age_display'), 'gender')}),
        (_("Contact Information"), {'fields': ('address', 'phone_number')}),
        (_("Emergency Contact"), {'fields': ('emergency_contact_name', 'emergency_contact_phone')}),
        (_("Audit Information"), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)})
    )
    inlines = [MedicalRecordInline]

    def user_account_link_display(self, obj):
        if obj.user:
            link = reverse("admin:users_customuser_change", args=[obj.user.id])
            return format_html('View/Edit User Account: <a href="{}">{} ({})</a>', link, obj.user.full_name, obj.user.email)
        return _("No associated user account.")
    user_account_link_display.short_description = _('User Account')

    def user_full_name_link_display(self, obj): # Link to Patient admin detail
        if obj.user:
            link = reverse("admin:patients_patient_change", args=[obj.user.id]) # Patient PK is user_id
            return format_html('<a href="{}">{}</a>', link, obj.user.full_name)
        return _("N/A")
    user_full_name_link_display.short_description = _('Full Name')
    user_full_name_link_display.admin_order_field = 'user__last_name'

    def user_email_display(self, obj):
        return obj.user.email if obj.user else _("N/A")
    user_email_display.short_description = _('Email')
    user_email_display.admin_order_field = 'user__email'

    def age_display(self, obj):
        return obj.age if obj.age is not None else _("N/A")
    age_display.short_description = _('Age')

    def phone_number_display(self,obj): # Now plain text
        return obj.phone_number or _("N/A")
    phone_number_display.short_description = _('Phone Number')

    def gender_display(self, obj):
        return obj.get_gender_display()
    gender_display.short_description = _('Gender')
    gender_display.admin_order_field = 'gender'

    def user_is_active_display(self, obj):
        return obj.user.is_active if obj.user else False
    user_is_active_display.short_description = _('User Active')
    user_is_active_display.boolean = True
    user_is_active_display.admin_order_field = 'user__is_active'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "user":
            # When adding a Patient record manually via admin (less common due to signal),
            # limit choices to users with PATIENT role not yet having a patient profile.
            # However, 'user' is a OneToOneField and PK, so it's usually set on creation.
            # For display/selection if ever needed:
            kwargs["queryset"] = CustomUser.objects.filter(role=UserRole.PATIENT).order_by('last_name', 'first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the MedicalRecord model.
    """
    list_display = (
        'id', 'patient_name_link_display', 'record_date',
        'diagnosis_summary_display', 'created_by_name_link_display'
    )
    search_fields = (
        'id__iexact',
        'patient__user__email__icontains',
        'diagnosis__icontains', # Now plain text
        'symptoms__icontains'   # Now plain text
    )
    list_filter = (('record_date', admin.DateFieldListFilter), ('created_by', admin.RelatedOnlyFieldListFilter), ('patient', admin.RelatedOnlyFieldListFilter))
    ordering = ('-record_date',)
    autocomplete_fields = ['patient', 'created_by']
    date_hierarchy = 'record_date'

    fields = ('patient', 'record_date', 'diagnosis', 'symptoms', 'treatment_plan', 'notes', 'created_by', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at') # record_date is editable on add

    def get_readonly_fields(self, request, obj=None):
        # Make record_date read-only after creation
        if obj: 
            return self.readonly_fields + ('record_date',)
        return self.readonly_fields


    def patient_name_link_display(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link_display.short_description = _('Patient')
    patient_name_link_display.admin_order_field = 'patient__user__last_name'

    def diagnosis_summary_display(self, obj): # Now plain text
        diag = obj.diagnosis
        return (diag[:75] + '...') if diag and len(diag) > 75 else diag or _("N/A")
    diagnosis_summary_display.short_description = _('Diagnosis Summary')

    def created_by_name_link_display(self, obj):
        if obj.created_by:
            link = reverse("admin:users_customuser_change", args=[obj.created_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.created_by.full_name)
        return _("N/A")
    created_by_name_link_display.short_description = _('Created By')
    created_by_name_link_display.admin_order_field = 'created_by__last_name'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "created_by":
            kwargs["queryset"] = CustomUser.objects.filter(
                role__in=[UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN], is_active=True
            ).order_by('last_name', 'first_name')
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'created_by')
