# billing/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html
from django.db.models import Sum

from .models import Invoice, InvoiceItem, Payment, InvoiceStatus, PaymentMethod
from users.models import UserRole, CustomUser
from patients.models import Patient
from appointments.models import Appointment
from medical_management.models import Treatment, Prescription

class InvoiceItemInline(admin.TabularInline):
    """
    Inline admin configuration for InvoiceItem.
    Allows managing invoice items directly within the Invoice admin page.
    """
    model = InvoiceItem
    extra = 1
    fields = ('description', 'quantity', 'unit_price', 'item_total_price_display', 'appointment', 'treatment', 'prescription')
    readonly_fields = ('item_total_price_display',)
    autocomplete_fields = ['appointment', 'treatment', 'prescription']
    verbose_name = _("Invoice Item")
    verbose_name_plural = _("Invoice Items")

    def item_total_price_display(self, obj):
        return f"{obj.total_price:.2f}" # Ensure currency formatting
    item_total_price_display.short_description = _('Total Price')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('appointment', 'treatment', 'prescription')

class PaymentInline(admin.TabularInline):
    """
    Inline admin configuration for Payment.
    Allows managing payments directly within the Invoice admin page.
    """
    model = Payment
    extra = 0
    fields = ('payment_date', 'amount', 'payment_method', 'transaction_id', 'recorded_by_link', 'notes', 'created_at')
    readonly_fields = ('created_at', 'recorded_by_link')
    autocomplete_fields = ['recorded_by'] # Keep for selection, but display link
    verbose_name = _("Payment")
    verbose_name_plural = _("Payments Received")
    ordering = ('-payment_date',)

    def recorded_by_link(self, obj):
        if obj.recorded_by:
            link = reverse("admin:users_customuser_change", args=[obj.recorded_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.recorded_by.full_name)
        return _("N/A")
    recorded_by_link.short_description = _('Recorded By')


    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "recorded_by":
            kwargs["queryset"] = CustomUser.objects.filter(
                role__in=[UserRole.ADMIN, UserRole.RECEPTIONIST], is_active=True
            ).order_by('last_name', 'first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recorded_by')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Invoice model.
    """
    list_display = (
        'invoice_number_link',
        'patient_name_link',
        'issue_date',
        'due_date',
        'total_amount_display',
        'paid_amount_display',
        'amount_due_display',
        'status_display', # Use display method
        'is_overdue_display',
    )
    search_fields = (
        'invoice_number__icontains',
        'patient__user__email__icontains',
        'patient__user__first_name__icontains',
        'patient__user__last_name__icontains',
    )
    list_filter = ('status', 'issue_date', 'due_date', ('patient', admin.RelatedOnlyFieldListFilter), ('created_by', admin.RelatedOnlyFieldListFilter))
    ordering = ('-issue_date',)
    autocomplete_fields = ['patient', 'created_by']
    date_hierarchy = 'issue_date'

    fieldsets = (
        (None, {
            'fields': ('patient', ('issue_date', 'due_date'), 'status')
        }),
        (_("Financials (Calculated)"), { # Clarify these are calculated
            'fields': ('invoice_number', 'total_amount_display', 'paid_amount_display', 'amount_due_display')
        }),
        (_("Administrative Information"), {
            'fields': ('created_by', 'notes')
        }),
        (_("Timestamps & Calculated Status"), {
            'fields': ('created_at', 'updated_at', 'is_overdue_display'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = (
        'invoice_number',
        'total_amount_display', 'paid_amount_display', 'amount_due_display',
        'created_at', 'updated_at', 'is_overdue_display'
    )
    inlines = [InvoiceItemInline, PaymentInline]

    def invoice_number_link(self, obj):
        link = reverse("admin:billing_invoice_change", args=[obj.id])
        return format_html('<a href="{}">{}</a>', link, obj.invoice_number)
    invoice_number_link.short_description = _('Invoice No.')
    invoice_number_link.admin_order_field = 'invoice_number'

    def patient_name_link(self, obj):
        if obj.patient and obj.patient.user:
            link = reverse("admin:patients_patient_change", args=[obj.patient.user.id])
            return format_html('<a href="{}">{}</a>', link, obj.patient.user.full_name)
        return _("N/A")
    patient_name_link.short_description = _('Patient')
    patient_name_link.admin_order_field = 'patient__user__last_name'

    def total_amount_display(self, obj): return f"{obj.total_amount:.2f}"
    total_amount_display.short_description = _('Total Amt.')
    total_amount_display.admin_order_field = 'total_amount'


    def paid_amount_display(self, obj): return f"{obj.paid_amount:.2f}"
    paid_amount_display.short_description = _('Paid Amt.')
    paid_amount_display.admin_order_field = 'paid_amount'


    def amount_due_display(self, obj): return f"{obj.amount_due:.2f}"
    amount_due_display.short_description = _('Amt. Due')
    # amount_due is a property, cannot be directly used for admin_order_field.
    # Sorting by amount_due would require annotation or custom manager method.

    def status_display(self, obj): return obj.get_status_display()
    status_display.short_description = _('Status')
    status_display.admin_order_field = 'status'

    def is_overdue_display(self, obj): return obj.is_overdue
    is_overdue_display.short_description = _('Overdue?')
    is_overdue_display.boolean = True

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "created_by":
            kwargs["queryset"] = CustomUser.objects.filter(
                role__in=[UserRole.ADMIN, UserRole.RECEPTIONIST], is_active=True
            ).order_by('last_name', 'first_name')
        elif db_field.name == "patient":
            kwargs["queryset"] = Patient.objects.select_related('user').filter(user__is_active=True).order_by('user__last_name', 'user__first_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.created_by and request.user.is_authenticated:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
        # Totals and status are updated by signals on InvoiceItem/Payment save/delete

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        # After related items (InvoiceItem, Payment) are saved, trigger update on the invoice.
        form.instance.update_invoice_totals_and_status()

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient__user', 'created_by').prefetch_related('items', 'payments')

@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the InvoiceItem model.
    Typically managed via InvoiceAdmin inlines, but direct access can be useful.
    """
    list_display = ('id', 'invoice_link', 'description', 'quantity', 'unit_price_display', 'item_total_price_display')
    search_fields = ('invoice__invoice_number__icontains', 'description__icontains', 'appointment__id__iexact', 'treatment__treatment_name__icontains')
    list_filter = ('invoice__status',)
    autocomplete_fields = ['invoice', 'appointment', 'treatment', 'prescription']
    readonly_fields = ('item_total_price_display',)
    list_select_related = ('invoice__patient__user', 'appointment', 'treatment', 'prescription')


    def invoice_link(self, obj):
        link = reverse("admin:billing_invoice_change", args=[obj.invoice.id])
        return format_html('<a href="{}">{}</a>', link, obj.invoice.invoice_number)
    invoice_link.short_description = _('Invoice')
    invoice_link.admin_order_field = 'invoice__invoice_number'

    def unit_price_display(self, obj): return f"{obj.unit_price:.2f}"
    unit_price_display.short_description = _('Unit Price')

    def item_total_price_display(self, obj): return f"{obj.total_price:.2f}"
    item_total_price_display.short_description = _('Total Price')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        obj.invoice.update_invoice_totals_and_status() # Trigger update on parent invoice

    def delete_model(self, request, obj):
        invoice_to_update = obj.invoice
        super().delete_model(request, obj)
        invoice_to_update.update_invoice_totals_and_status()


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Admin interface configuration for the Payment model.
    Typically managed via InvoiceAdmin inlines.
    """
    list_display = ('id', 'invoice_link', 'payment_date', 'amount_display', 'payment_method_display', 'transaction_id', 'recorded_by_name_link')
    search_fields = ('invoice__invoice_number__icontains', 'transaction_id__icontains', 'recorded_by__email__icontains', 'invoice__patient__user__email__icontains')
    list_filter = ('payment_method', 'payment_date', ('recorded_by', admin.RelatedOnlyFieldListFilter), ('invoice__status', admin.AllValuesFieldListFilter))
    autocomplete_fields = ['invoice', 'recorded_by']
    date_hierarchy = 'payment_date'
    ordering = ('-payment_date',)
    list_select_related = ('invoice__patient__user', 'recorded_by')

    def invoice_link(self, obj):
        link = reverse("admin:billing_invoice_change", args=[obj.invoice.id])
        return format_html('<a href="{}">{}</a>', link, obj.invoice.invoice_number)
    invoice_link.short_description = _('Invoice')
    invoice_link.admin_order_field = 'invoice__invoice_number'

    def amount_display(self, obj): return f"{obj.amount:.2f}"
    amount_display.short_description = _('Amount Paid')
    amount_display.admin_order_field = 'amount'


    def payment_method_display(self, obj): return obj.get_payment_method_display()
    payment_method_display.short_description = _('Method')
    payment_method_display.admin_order_field = 'payment_method'


    def recorded_by_name_link(self, obj):
        if obj.recorded_by:
            link = reverse("admin:users_customuser_change", args=[obj.recorded_by.id])
            return format_html('<a href="{}">{}</a>', link, obj.recorded_by.full_name)
        return _("N/A")
    recorded_by_name_link.short_description = _('Recorded By')
    recorded_by_name_link.admin_order_field = 'recorded_by__last_name'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "recorded_by":
            kwargs["queryset"] = CustomUser.objects.filter(
                role__in=[UserRole.ADMIN, UserRole.RECEPTIONIST], is_active=True
            ).order_by('last_name', 'first_name')
        elif db_field.name == "invoice":
             kwargs["queryset"] = Invoice.objects.select_related('patient__user').order_by('-issue_date', 'patient__user__last_name')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.recorded_by and request.user.is_authenticated:
            obj.recorded_by = request.user
        super().save_model(request, obj, form, change)
        # Signal handles updating invoice totals and status

    def delete_model(self, request, obj):
        # Signal handles updating invoice totals and status
        super().delete_model(request, obj)
