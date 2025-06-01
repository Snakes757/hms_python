# appointments/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html
from django.utils import timezone

from .models import Appointment, AppointmentStatus, AppointmentType
from users.models import UserRole, CustomUser
from patients.models import Patient

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Appointment model.
    Provides list display, search, filtering, and detailed view customizations.
    """
    list_display = (
        'id',
        'patient_name_link',
        'doctor_name_link',
        'appointment_type_display', # Use display method for choices
        'appointment_date_time',
        'status_display', # Use display method for choices
        'scheduled_by_name',
        'is_upcoming_display',
        'is_past_display',
    )
    search_fields = (
        'id__iexact', # Search by exact ID
        'patient__user__email__icontains',
        'patient__user__first_name__icontains',
        'patient__user__last_name__icontains',
        'doctor__email__icontains',
        'doctor__first_name__icontains',
        'doctor__last_name__icontains',
        'reason__icontains',
    )
    list_filter = (
        'status',
        'appointment_type',
        'appointment_date_time',
        ('doctor', admin.RelatedOnlyFieldListFilter),
        ('patient', admin.RelatedOnlyFieldListFilter),
        ('scheduled_by', admin.RelatedOnlyFieldListFilter),
    )
    ordering = ('-appointment_date_time',)
    date_hierarchy = 'appointment_date_time'

    autocomplete_fields = ['patient', 'doctor', 'scheduled_by', 'original_appointment']

    fieldsets = (
        (_("Core Information"), {
            'fields': ('patient', 'doctor', 'appointment_type', 'appointment_date_time', 'estimated_duration_minutes')
        }),
        (_("Status and Details"), {
            'fields': ('status', 'reason', 'notes')
        }),
        (_("Scheduling Information"), {
            'fields': ('scheduled_by', 'original_appointment')
        }),
        (_("Timestamps & Calculated Status"), {
            'fields': ('created_at', 'updated_at', 'is_upcoming_display', 'is_past_display'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'is_upcoming_display', 'is_past_display')

    def patient_name_link(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link.short_description = _('Patient')
    patient_name_link.admin_order_field = 'patient__user__last_name'

    def doctor_name_link(self, obj):
        if obj.doctor:
            link = reverse("admin:users_customuser_change", args=[obj.doctor.id])
            return format_html('<a href="{}">{}</a>', link, obj.doctor.full_name)
        return _("Unassigned")
    doctor_name_link.short_description = _('Doctor')
    doctor_name_link.admin_order_field = 'doctor__last_name'

    def scheduled_by_name(self, obj):
        return obj.scheduled_by.full_name if obj.scheduled_by else _("N/A")
    scheduled_by_name.short_description = _('Scheduled By')
    scheduled_by_name.admin_order_field = 'scheduled_by__last_name'

    def appointment_type_display(self, obj):
        return obj.get_appointment_type_display()
    appointment_type_display.short_description = _('Type')
    appointment_type_display.admin_order_field = 'appointment_type'

    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = _('Status')
    status_display.admin_order_field = 'status'

    def is_upcoming_display(self, obj):
        return obj.is_upcoming
    is_upcoming_display.short_description = _('Upcoming?')
    is_upcoming_display.boolean = True

    def is_past_display(self, obj):
        return obj.is_past
    is_past_display.short_description = _('Past?')
    is_past_display.boolean = True

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "doctor":
            kwargs["queryset"] = CustomUser.objects.filter(role=UserRole.DOCTOR, is_active=True).order_by('last_name', 'first_name')
        elif db_field.name == "scheduled_by":
            kwargs["queryset"] = CustomUser.objects.filter(is_active=True, role__in=[UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE]).order_by('last_name', 'first_name')
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj: # Existing object
            final_statuses = [
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED_BY_PATIENT,
                AppointmentStatus.CANCELLED_BY_STAFF,
                AppointmentStatus.NO_SHOW
            ]
            # RESCHEDULED is often a soft-delete/pointer, so allow status change from it.
            if obj.status in final_statuses:
                readonly.extend([
                    'patient', 'doctor', 'appointment_type', 'appointment_date_time',
                    'estimated_duration_minutes', 'reason', 'notes',
                    'original_appointment', 'scheduled_by'
                ])
        return tuple(set(readonly))

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.scheduled_by and request.user.is_authenticated: # If new and scheduled_by not set
            obj.scheduled_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'patient__user', 'doctor', 'scheduled_by', 'original_appointment__patient__user'
        )
