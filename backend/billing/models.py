from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, F, ExpressionWrapper, DecimalField
from django.core.exceptions import ValidationError
from decimal import Decimal # Ensure Decimal is imported

from patients.models import Patient
from appointments.models import Appointment # Optional link for invoice items
from medical_management.models import Treatment, Prescription # Optional links for invoice items
from users.models import UserRole # For limiting choices on created_by/recorded_by

class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', _('Draft')
    SENT = 'SENT', _('Sent')
    PAID = 'PAID', _('Paid')
    PARTIALLY_PAID = 'PARTIALLY_PAID', _('Partially Paid')
    VOID = 'VOID', _('Void')
    OVERDUE = 'OVERDUE', _('Overdue')

class PaymentMethod(models.TextChoices):
    CASH = 'CASH', _('Cash')
    CREDIT_CARD = 'CREDIT_CARD', _('Credit Card')
    DEBIT_CARD = 'DEBIT_CARD', _('Debit Card')
    BANK_TRANSFER = 'BANK_TRANSFER', _('Bank Transfer')
    INSURANCE = 'INSURANCE', _('Insurance Claim') # Clarified
    MOBILE_MONEY = 'MOBILE_MONEY', _('Mobile Money')
    OTHER = 'OTHER', _('Other')

class Invoice(models.Model):
    """
    Represents an invoice issued to a patient for services and items.
    It tracks the total amount, paid amount, and status of the invoice.
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT, # Prevent deleting patient if invoices exist
        related_name='invoices',
        verbose_name=_("Patient")
    )
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        verbose_name=_("Invoice Number"),
        help_text=_("Auto-generated unique invoice identifier.")
    )
    issue_date = models.DateField(default=timezone.now, verbose_name=_("Issue Date"), db_index=True)
    due_date = models.DateField(verbose_name=_("Due Date"), db_index=True)
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'), editable=False, # Corrected default
        verbose_name=_("Total Amount"), help_text=_("Calculated sum of all invoice items.")
    )
    paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal('0.00'), editable=False, # Corrected default
        verbose_name=_("Paid Amount"), help_text=_("Calculated sum of all payments made against this invoice.")
    )
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.DRAFT,
        verbose_name=_("Status"),
        db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_invoices',
        limit_choices_to={'role__in': [UserRole.ADMIN, UserRole.RECEPTIONIST]},
        verbose_name=_("Created By (Staff)")
    )
    notes = models.TextField(
        blank=True, verbose_name=_("Notes"),
        help_text=_("Internal notes or notes for the patient regarding this invoice.")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        verbose_name = _("Invoice")
        verbose_name_plural = _("Invoices")
        ordering = ['-issue_date', '-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
        ]

    def __str__(self):
        # Corrected to use full_name_display
        patient_name = self.patient.user.full_name_display if self.patient and self.patient.user else _("N/A")
        return f"Invoice {self.invoice_number} for {patient_name} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        """
        Overrides the save method to auto-generate an invoice number if it's not set
        and to validate that the due date is not before the issue date.
        It also calls update_invoice_totals_and_status to ensure financial figures and status are current.
        """
        if not self.invoice_number:
            today_str = timezone.now().strftime('%Y%m%d')
            # Atomically find the last invoice for today to generate a new sequence number
            # This part might need adjustment for very high concurrency to ensure absolute uniqueness without race conditions.
            # For most HMS, this sequence generation should be sufficient.
            last_invoice_today = Invoice.objects.filter(invoice_number__startswith=f"INV-{today_str}-").order_by('invoice_number').last()
            if last_invoice_today and last_invoice_today.invoice_number:
                try:
                    last_seq = int(last_invoice_today.invoice_number.split('-')[-1])
                    new_seq = last_seq + 1
                except (IndexError, ValueError): # Fallback if parsing fails
                    # This fallback might lead to non-sequential numbers if parsing fails often, but ensures uniqueness for the day.
                    new_seq = Invoice.objects.filter(invoice_number__startswith=f"INV-{today_str}-").count() + 1
            else:
                new_seq = 1
            self.invoice_number = f"INV-{today_str}-{new_seq:04d}"

        if self.due_date and self.issue_date and self.due_date < self.issue_date:
            raise ValidationError(_("Due date cannot be before the issue date."))

        # Call the original save method first to ensure an ID is available for signals, etc.
        super().save(*args, **kwargs)

        # Update totals and status after the main save, unless specific fields were updated that don't affect totals/status.
        # The `update_fields` kwarg is used by Django's `save()` method.
        # If `update_fields` is None, it means all fields are being saved.
        # If `update_fields` is specified, we only run `update_invoice_totals_and_status` if relevant fields were part of the update.
        if kwargs.get('update_fields') is None or any(f in kwargs['update_fields'] for f in ['status', 'issue_date', 'due_date']):
             self.update_invoice_totals_and_status(force_save=False) # Avoid recursion if called from update_invoice_totals_and_status itself

    @property
    def amount_due(self):
        """Calculates the outstanding amount on the invoice."""
        # Ensure both operands are Decimal before subtraction
        return Decimal(self.total_amount) - Decimal(self.paid_amount)

    @property
    def is_overdue(self):
        """Checks if the invoice is overdue based on its due date and status."""
        return self.due_date < timezone.now().date() and self.status not in [
            InvoiceStatus.PAID, InvoiceStatus.VOID, InvoiceStatus.DRAFT
        ]

    def update_invoice_totals_and_status(self, force_save=True):
        """
        Recalculates the total_amount and paid_amount based on associated
        InvoiceItems and Payments. Then, updates the invoice status accordingly.
        This method is crucial for maintaining data integrity.

        Args:
            force_save (bool): If True, saves the invoice instance after updating.
                               Set to False to prevent recursive saves if called from within save().
        """
        # Calculate total amount from items
        calculated_total_amount = self.items.aggregate(
            total=Sum(ExpressionWrapper(F('quantity') * F('unit_price'), output_field=DecimalField()))
        )['total'] or Decimal('0.00') # Ensure Decimal for consistency

        # Calculate paid amount from payments
        calculated_paid_amount = self.payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        changed_fields = []
        if self.total_amount != calculated_total_amount:
            self.total_amount = calculated_total_amount # This is already a Decimal
            changed_fields.append('total_amount')
        if self.paid_amount != calculated_paid_amount:
            self.paid_amount = calculated_paid_amount # This is already a Decimal
            changed_fields.append('paid_amount')

        # Determine the new status based on amounts and due date
        current_status = self.status
        new_status = current_status # Assume no change initially

        if current_status == InvoiceStatus.VOID: # Void invoices remain void
            pass
        elif self.total_amount == Decimal('0.00') and self.paid_amount == Decimal('0.00') and current_status == InvoiceStatus.DRAFT:
            new_status = InvoiceStatus.DRAFT # Zero value draft invoice
        elif self.paid_amount >= self.total_amount and self.total_amount > Decimal('0.00'):
            new_status = InvoiceStatus.PAID
        elif self.paid_amount > Decimal('0.00') and self.paid_amount < self.total_amount:
            new_status = InvoiceStatus.PARTIALLY_PAID
        elif self.is_overdue and current_status not in [InvoiceStatus.DRAFT, InvoiceStatus.PAID, InvoiceStatus.VOID]:
            new_status = InvoiceStatus.OVERDUE
        elif current_status == InvoiceStatus.DRAFT and self.paid_amount == Decimal('0.00'): # Remains DRAFT if no payment and not explicitly sent
            pass
        elif current_status != InvoiceStatus.SENT and self.paid_amount == Decimal('0.00') and self.total_amount > Decimal('0.00') and not self.is_overdue:
            # If not DRAFT, not PAID, not VOID, no payments, positive total, and not overdue, it should be SENT.
            # This handles cases where it might have been OVERDUE but dates changed, or was DRAFT and items added.
            if current_status not in [InvoiceStatus.DRAFT]: # Avoid reverting to SENT if it was something else like OVERDUE and then dates changed
                 new_status = InvoiceStatus.SENT

        if self.status != new_status:
            self.status = new_status
            changed_fields.append('status')

        if changed_fields and force_save:
            self.save(update_fields=changed_fields) # Save only the changed fields to avoid recursion and unnecessary updates
        elif changed_fields and not force_save:
            # If not forcing save, it means this method was likely called from within the main save() method.
            # The main save() will handle saving these changed fields.
            pass

class InvoiceItem(models.Model):
    """
    Represents a single line item on an invoice, detailing a service or product.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_("Invoice")
    )
    description = models.CharField(max_length=255, verbose_name=_("Service/Item Description"))
    quantity = models.PositiveIntegerField(default=1, verbose_name=_("Quantity"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Unit Price"))

    # Optional links to other relevant models
    appointment = models.ForeignKey(
        Appointment, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invoice_items_linked', verbose_name=_("Linked Appointment")
    )
    treatment = models.ForeignKey(
        Treatment, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invoice_items_linked', verbose_name=_("Linked Treatment")
    )
    prescription = models.ForeignKey(
        Prescription, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='invoice_items_linked', verbose_name=_("Linked Prescription")
    )

    class Meta:
        verbose_name = _("Invoice Item")
        verbose_name_plural = _("Invoice Items")
        ordering = ['id'] # Default ordering by ID

    def __str__(self):
        return f"{self.description} (Qty: {self.quantity}) for Invoice {self.invoice.invoice_number}"

    @property
    def total_price(self):
        """Calculates the total price for this line item (quantity * unit_price)."""
        return self.quantity * self.unit_price

    def clean(self):
        """Validates the invoice item data before saving."""
        super().clean()
        if self.quantity <= 0:
            raise ValidationError({'quantity': _("Quantity must be greater than zero.")})
        if self.unit_price < Decimal('0.00'): # Allow zero price, but not negative
            raise ValidationError({'unit_price': _("Unit price cannot be negative.")})

class Payment(models.Model):
    """
    Represents a payment made by a patient towards an invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE, # If invoice is deleted, its payments are also deleted.
        related_name='payments',
        verbose_name=_("Invoice")
    )
    payment_date = models.DateTimeField(default=timezone.now, verbose_name=_("Payment Date"), db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Amount Paid"))
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethod.choices,
        verbose_name=_("Payment Method")
    )
    transaction_id = models.CharField(
        max_length=100, blank=True, null=True, verbose_name=_("Transaction ID/Reference"),
        help_text=_("E.g., credit card transaction ID, bank transfer reference, cheque number.")
    )
    notes = models.TextField(blank=True, verbose_name=_("Payment Notes"))
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='recorded_payments',
        limit_choices_to={'role__in': [UserRole.ADMIN, UserRole.RECEPTIONIST]},
        verbose_name=_("Recorded By (Staff)")
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Recorded At")) # When the payment record was created in the system

    class Meta:
        verbose_name = _("Payment")
        verbose_name_plural = _("Payments")
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment of {self.amount} for Invoice {self.invoice.invoice_number} via {self.get_payment_method_display()}"

    def clean(self):
        """Validates the payment data before saving."""
        super().clean()
        if self.amount <= Decimal('0.00'):
            raise ValidationError({'amount': _("Payment amount must be positive.")})

    def save(self, *args, **kwargs):
        """
        Overrides save to ensure invoice totals and status are updated after a payment is saved or changed.
        """
        super().save(*args, **kwargs)
        # The signals for Payment post_save/post_delete will handle updating the invoice.
        # No need to call self.invoice.update_invoice_totals_and_status() directly here
        # if signals are correctly set up, to avoid double updates.
        # However, if signals are not used or for direct admin saves, it might be needed.
        # For now, relying on signals.

