# telemedicine/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html
from django.db.models import Q # For complex queryset filtering if needed

from .models import TelemedicineSession, TelemedicineSessionStatus
from appointments.models import Appointment, AppointmentType
from users.models import UserRole, CustomUser
from patients.models import Patient

@admin.register(TelemedicineSession)
class TelemedicineSessionAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the TelemedicineSession model.
    """
    list_display = (
        'id', 'patient_name_link_display', 'doctor_name_link_display',
        'session_start_time', 'status_display', 'appointment_link_display',
        'session_url_clickable', 'duration_minutes_display',
    )
    search_fields = (
        'id__iexact',
        'patient__user__email__icontains',
        'patient__user__first_name__icontains',
        'patient__user__last_name__icontains',
        'doctor__email__icontains',
        'doctor__first_name__icontains',
        'doctor__last_name__icontains',
        'session_url__icontains',
        'reason_for_consultation__icontains',
        'appointment__id__iexact', # Search by linked appointment ID
    )
    list_filter = ('status', 'session_start_time', ('doctor', admin.RelatedOnlyFieldListFilter), ('patient', admin.RelatedOnlyFieldListFilter))
    ordering = ('-session_start_time',)
    autocomplete_fields = ['patient', 'doctor', 'appointment']
    date_hierarchy = 'session_start_time'

    fieldsets = (
        (_("Core Information"), {'fields': ('patient', 'doctor', 'appointment')}),
        (_("Session Details"), {
            'fields': (
                'session_start_time', 'session_end_time',
                'estimated_duration_minutes', 'duration_minutes_display',
                'status', 'session_url', 'recording_url'
            )
        }),
        (_("Consultation Information"), {'fields': ('reason_for_consultation', 'doctor_notes', 'patient_feedback')}),
        (_("Timestamps"), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at', 'duration_minutes_display')

    def patient_name_link_display(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link_display.short_description = _('Patient')
    patient_name_link_display.admin_order_field = 'patient__user__last_name'

    def doctor_name_link_display(self, obj):
        if obj.doctor:
            link = reverse("admin:users_customuser_change", args=[obj.doctor.id])
            return format_html('<a href="{}">{}</a>', link, obj.doctor.full_name)
        return _("N/A")
    doctor_name_link_display.short_description = _('Doctor')
    doctor_name_link_display.admin_order_field = 'doctor__last_name'

    def appointment_link_display(self, obj):
        if obj.appointment:
            link = reverse("admin:appointments_appointment_change", args=[obj.appointment.id])
            appt_time = obj.appointment.appointment_date_time.strftime('%Y-%m-%d %H:%M') if obj.appointment.appointment_date_time else _("N/A")
            return format_html('<a href="{}">Appt. ID: {} ({})</a>', link, obj.appointment.id, appt_time)
        return _("N/A")
    appointment_link_display.short_description = _('Linked Appointment')
    appointment_link_display.admin_order_field = 'appointment__id' # Allow sorting by appointment ID

    def session_url_clickable(self, obj):
        if obj.session_url:
            return format_html('<a href="{0}" target="_blank" rel="noopener noreferrer">{0}</a>', obj.session_url)
        return _("N/A")
    session_url_clickable.short_description = _('Session URL')

    def duration_minutes_display(self, obj):
        return obj.duration_minutes
    duration_minutes_display.short_description = _('Actual/Est. Duration (min)')

    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = _('Status')
    status_display.admin_order_field = 'status'


    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "doctor":
            kwargs["queryset"] = CustomUser.objects.filter(role=UserRole.DOCTOR, is_active=True).order_by('last_name', 'first_name')
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        elif db_field.name == "appointment":
            # Filter appointments to show only TELEMEDICINE type and those not already linked to another TelemedicineSession
            # (unless it's the current session's appointment).
            current_obj_id = request.resolver_match.kwargs.get('object_id')
            base_queryset = Appointment.objects.filter(appointment_type=AppointmentType.TELEMEDICINE)

            if current_obj_id: # If editing an existing TelemedicineSession
                try:
                    current_session = self.model.objects.get(pk=current_obj_id)
                    # Allow selecting the current appointment OR unlinked telemedicine appointments
                    kwargs["queryset"] = base_queryset.filter(
                        Q(telemedicine_session_details__isnull=True) | Q(pk=current_session.appointment_id)
                    ).distinct().order_by('-appointment_date_time', 'patient__user__last_name')
                except self.model.DoesNotExist: # Should not happen if object_id is valid
                     kwargs["queryset"] = base_queryset.filter(telemedicine_session_details__isnull=True).distinct().order_by('-appointment_date_time')
            else: # If creating a new TelemedicineSession
                kwargs["queryset"] = base_queryset.filter(telemedicine_session_details__isnull=True).distinct().order_by('-appointment_date_time')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.status in [
            TelemedicineSessionStatus.COMPLETED,
            TelemedicineSessionStatus.CANCELLED,
            TelemedicineSessionStatus.FAILED
        ]:
            readonly.extend([
                'patient', 'doctor', 'appointment', 'session_start_time', 'session_end_time',
                'estimated_duration_minutes', 'session_url', 'reason_for_consultation'
            ])
        return tuple(set(readonly))

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Logic to update linked Appointment status is now in TelemedicineSession model's save method or signals.

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'patient__user', 'doctor', 'appointment__patient__user', 'appointment__doctor'
        )
