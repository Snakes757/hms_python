# medical_management/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html

from .models import Prescription, Treatment, Observation
from users.models import UserRole, CustomUser
from patients.models import Patient
from appointments.models import Appointment
from patients.models import MedicalRecord # For linking, not direct inline here

# Note: fernet_fields (EncryptedTextField, EncryptedCharField) were removed from settings.
# If these fields were used in models, they are now effectively CharField/TextField.
# The admin will display their plain text content.

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Prescription model.
    """
    list_display = (
        'id', 'patient_name_link_display', 'medication_name',
        'dosage_display', 'frequency_display', # Methods to handle potential old encrypted data display
        'prescribed_by_name_link_display', 'prescription_date', 'is_active',
    )
    search_fields = (
        'id__iexact',
        'patient__user__email__icontains',
        'patient__user__first_name__icontains',
        'patient__user__last_name__icontains',
        'medication_name__icontains',
        'prescribed_by__email__icontains',
    )
    list_filter = ('prescription_date', 'is_active', ('prescribed_by', admin.RelatedOnlyFieldListFilter), ('patient', admin.RelatedOnlyFieldListFilter))
    ordering = ('-prescription_date',)
    autocomplete_fields = ['patient', 'prescribed_by', 'appointment', 'medical_record']
    date_hierarchy = 'prescription_date'

    fieldsets = (
        (None, {'fields': ('patient', 'medication_name', 'dosage', 'frequency', 'duration_days', 'instructions')}),
        (_("Administrative Information"), {'fields': ('prescribed_by', 'prescription_date', 'is_active')}),
        (_("Optional Links"), {'fields': ('appointment', 'medical_record'), 'classes': ('collapse',)}),
    )
    # prescription_date is auto_now_add=False, default=timezone.now, so it's editable on add, read-only on change.
    readonly_fields = ('created_at', 'updated_at') # Standard audit fields

    def patient_name_link_display(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link_display.short_description = _('Patient')
    patient_name_link_display.admin_order_field = 'patient__user__last_name'

    def prescribed_by_name_link_display(self, obj):
        if obj.prescribed_by:
            link = reverse("admin:users_customuser_change", args=[obj.prescribed_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.prescribed_by.full_name)
        return _("N/A")
    prescribed_by_name_link_display.short_description = _('Prescribed By')
    prescribed_by_name_link_display.admin_order_field = 'prescribed_by__last_name'

    def dosage_display(self, obj): return obj.dosage # Now plain text
    dosage_display.short_description = _('Dosage')

    def frequency_display(self, obj): return obj.frequency # Now plain text
    frequency_display.short_description = _('Frequency')

    def get_readonly_fields(self, request, obj=None):
        # Make prescription_date read-only after creation
        if obj: # obj is not None, so this is a change page
            return self.readonly_fields + ('prescription_date',)
        return self.readonly_fields


    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "prescribed_by":
            kwargs["queryset"] = CustomUser.objects.filter(role=UserRole.DOCTOR, is_active=True).order_by('last_name', 'first_name')
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        elif db_field.name == "appointment":
            kwargs["queryset"] = Appointment.objects.select_related('patient__user', 'doctor').order_by('-appointment_date_time')
        elif db_field.name == "medical_record":
            kwargs["queryset"] = MedicalRecord.objects.select_related('patient__user').order_by('-record_date')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'prescribed_by', 'appointment', 'medical_record')

@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Treatment model.
    """
    list_display = (
        'id', 'patient_name_link_display', 'treatment_name',
        'treatment_date_time', 'administered_by_name_link_display',
    )
    search_fields = (
        'id__iexact',
        'patient__user__email__icontains', 'treatment_name__icontains',
        'administered_by__email__icontains',
    )
    list_filter = ('treatment_date_time', ('administered_by', admin.RelatedOnlyFieldListFilter), ('patient', admin.RelatedOnlyFieldListFilter))
    ordering = ('-treatment_date_time',)
    autocomplete_fields = ['patient', 'administered_by', 'appointment', 'medical_record']
    date_hierarchy = 'treatment_date_time'

    fieldsets = (
        (None, {'fields': ('patient', 'treatment_name', 'treatment_date_time', 'description', 'outcome', 'notes')}),
        (_("Administrative Information"), {'fields': ('administered_by',)}),
        (_("Optional Links"), {'fields': ('appointment', 'medical_record'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')

    def patient_name_link_display(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link_display.short_description = _('Patient')
    patient_name_link_display.admin_order_field = 'patient__user__last_name'

    def administered_by_name_link_display(self, obj):
        if obj.administered_by:
            link = reverse("admin:users_customuser_change", args=[obj.administered_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.administered_by.full_name)
        return _("N/A")
    administered_by_name_link_display.short_description = _('Administered By')
    administered_by_name_link_display.admin_order_field = 'administered_by__last_name'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "administered_by":
            kwargs["queryset"] = CustomUser.objects.filter(role__in=[UserRole.DOCTOR, UserRole.NURSE], is_active=True).order_by('last_name', 'first_name')
        # Other FKs handled similarly as in PrescriptionAdmin
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        elif db_field.name == "appointment":
            kwargs["queryset"] = Appointment.objects.select_related('patient__user', 'doctor').order_by('-appointment_date_time')
        elif db_field.name == "medical_record":
            kwargs["queryset"] = MedicalRecord.objects.select_related('patient__user').order_by('-record_date')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'administered_by', 'appointment', 'medical_record')

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Observation model.
    """
    list_display = (
        'id', 'patient_name_link_display', 'observation_date_time',
        'symptoms_observed_summary', 'observed_by_name_link_display',
    )
    search_fields = (
        'id__iexact',
        'patient__user__email__icontains',
        'symptoms_observed__icontains', # Now plain text
        'description__icontains',       # Now plain text
        'observed_by__email__icontains',
    )
    list_filter = ('observation_date_time', ('observed_by', admin.RelatedOnlyFieldListFilter), ('patient', admin.RelatedOnlyFieldListFilter))
    ordering = ('-observation_date_time',)
    autocomplete_fields = ['patient', 'observed_by', 'appointment', 'medical_record']
    date_hierarchy = 'observation_date_time'

    fieldsets = (
        (None, {'fields': ('patient', 'symptoms_observed', 'vital_signs', 'description', 'notes')}),
        (_("Administrative Information"), {'fields': ('observed_by', 'observation_date_time')}),
        (_("Optional Links"), {'fields': ('appointment', 'medical_record'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at') # observation_date_time is editable on add

    def get_readonly_fields(self, request, obj=None):
        # Make observation_date_time read-only after creation
        if obj: 
            return self.readonly_fields + ('observation_date_time',)
        return self.readonly_fields

    def patient_name_link_display(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link_display.short_description = _('Patient')
    patient_name_link_display.admin_order_field = 'patient__user__last_name'

    def observed_by_name_link_display(self, obj):
        if obj.observed_by:
            link = reverse("admin:users_customuser_change", args=[obj.observed_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.observed_by.full_name)
        return _("N/A")
    observed_by_name_link_display.short_description = _('Observed By')
    observed_by_name_link_display.admin_order_field = 'observed_by__last_name'

    def symptoms_observed_summary(self, obj): # Now plain text
        symptoms = obj.symptoms_observed
        return (symptoms[:75] + '...') if symptoms and len(symptoms) > 75 else symptoms or _("N/A")
    symptoms_observed_summary.short_description = _('Symptoms Summary')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "observed_by":
            kwargs["queryset"] = CustomUser.objects.filter(role__in=[UserRole.DOCTOR, UserRole.NURSE], is_active=True).order_by('last_name', 'first_name')
        # Other FKs handled similarly
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        elif db_field.name == "appointment":
            kwargs["queryset"] = Appointment.objects.select_related('patient__user', 'doctor').order_by('-appointment_date_time')
        elif db_field.name == "medical_record":
            kwargs["queryset"] = MedicalRecord.objects.select_related('patient__user').order_by('-record_date')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'observed_by', 'appointment', 'medical_record')
