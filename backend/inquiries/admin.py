# inquiries/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html

from .models import Inquiry, InquiryStatus, InquirySource
from users.models import UserRole, CustomUser
from patients.models import Patient

@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Inquiry model.
    Provides list display, search, filtering, and detailed view customizations.
    """
    list_display = (
        'id',
        'subject_summary', # Use summary for brevity
        'inquirer_name',
        'patient_link_display',
        'source_display', # Use display method
        'status_display', # Use display method
        'handled_by_name_link_display',
        'created_at',
        'updated_at',
    )
    list_filter = ('status', 'source', 'created_at', ('handled_by', admin.RelatedOnlyFieldListFilter), ('patient', admin.RelatedOnlyFieldListFilter))
    search_fields = (
        'id__iexact',
        'subject__icontains',
        'description__icontains',
        'inquirer_name__icontains',
        'inquirer_email__icontains',
        'inquirer_phone__icontains',
        'patient__user__email__icontains',
        'patient__user__first_name__icontains',
        'patient__user__last_name__icontains',
        'handled_by__email__icontains',
        'handled_by__first_name__icontains',
        'handled_by__last_name__icontains',
    )
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['patient', 'handled_by']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    fieldsets = (
        (_("Inquiry Details"), {'fields': ('subject', 'description', 'source')}),
        (_("Inquirer Information"), {'fields': ('inquirer_name', 'inquirer_email', 'inquirer_phone', 'patient')}),
        (_("Processing Information"), {'fields': ('status', 'handled_by', 'resolution_notes')}),
        (_("Timestamps"), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def subject_summary(self, obj):
        return (obj.subject[:75] + '...') if len(obj.subject) > 75 else obj.subject
    subject_summary.short_description = _('Subject')

    def patient_link_display(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_link_display.short_description = _("Associated Patient")
    patient_link_display.admin_order_field = 'patient__user__last_name'

    def handled_by_name_link_display(self, obj):
        if obj.handled_by:
            link = reverse("admin:users_customuser_change", args=[obj.handled_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.handled_by.full_name)
        return _("N/A")
    handled_by_name_link_display.short_description = _("Handled By")
    handled_by_name_link_display.admin_order_field = 'handled_by__last_name'

    def source_display(self, obj):
        return obj.get_source_display()
    source_display.short_description = _('Source')
    source_display.admin_order_field = 'source'

    def status_display(self, obj):
        return obj.get_status_display()
    status_display.short_description = _('Status')
    status_display.admin_order_field = 'status'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "handled_by":
            kwargs["queryset"] = CustomUser.objects.filter(
                role__in=[UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.NURSE], is_active=True
            ).order_by('last_name', 'first_name')
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        # Auto-assign handled_by if status implies active handling and no one is assigned
        if not obj.handled_by and obj.status in [InquiryStatus.IN_PROGRESS, InquiryStatus.RESOLVED, InquiryStatus.CLOSED]:
            if request.user.is_authenticated and request.user.role in [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.NURSE]:
                obj.handled_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'handled_by')
