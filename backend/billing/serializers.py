# billing/serializers.py
from rest_framework import serializers
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db import transaction
from decimal import Decimal

from .models import Invoice, InvoiceItem, Payment, InvoiceStatus, PaymentMethod
from patients.serializers import PatientSerializer
from users.serializers import CustomUserSerializer
from users.models import CustomUser, UserRole # Patient model is NOT here
from patients.models import Patient # Correct import for Patient model
from appointments.models import Appointment # For linking invoice items
from medical_management.models import Treatment, Prescription # For linking invoice items

class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Serializer for InvoiceItem model.
    Used for creating, updating, and representing invoice line items.
    """
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    # Optional: Add fields to display linked item details if needed for GET responses
    # appointment_details = AppointmentSerializer(source='appointment', read_only=True, required=False)
    # treatment_details = TreatmentSerializer(source='treatment', read_only=True, required=False)
    # prescription_details = PrescriptionSerializer(source='prescription', read_only=True, required=False)

    class Meta:
        model = InvoiceItem
        fields = (
            'id', 'invoice', 'description', 'quantity', 'unit_price', 'total_price',
            'appointment', 'treatment', 'prescription',
            # 'appointment_details', 'treatment_details', 'prescription_details' # If added above
        )
        read_only_fields = ('id', 'total_price')
        extra_kwargs = {
            'invoice': {'write_only': True, 'required': False, 'allow_null': True}, # Usually set by parent InvoiceSerializer
            'appointment': {'required': False, 'allow_null': True, 'queryset': Appointment.objects.all()},
            'treatment': {'required': False, 'allow_null': True, 'queryset': Treatment.objects.all()},
            'prescription': {'required': False, 'allow_null': True, 'queryset': Prescription.objects.all()},
            'description': {'max_length': 255},
            'unit_price': {'min_value': Decimal('0.00')},
            'quantity': {'min_value': 1},
        }

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError(_("Quantity must be a positive integer."))
        return value

    def validate_unit_price(self, value):
        if value < Decimal('0.00'): # Allow zero price, but not negative
            raise serializers.ValidationError(_("Unit price cannot be negative."))
        return value

class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model.
    Handles creation, updating, and representation of payments against invoices.
    """
    recorded_by_details = CustomUserSerializer(source='recorded_by', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    patient_name = serializers.CharField(source='invoice.patient.user.full_name', read_only=True)


    invoice = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.all(),
        help_text=_("ID of the invoice this payment is for.")
    )
    recorded_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role__in=[UserRole.ADMIN, UserRole.RECEPTIONIST], is_active=True),
        required=False, allow_null=True,
        help_text=_("ID of the staff member who recorded this payment (optional, can be system-assigned).")
    )

    class Meta:
        model = Payment
        fields = (
            'id', 'invoice', 'invoice_number', 'patient_name', 'payment_date', 'amount',
            'payment_method', 'payment_method_display',
            'transaction_id', 'notes', 'recorded_by', 'recorded_by_details', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'recorded_by_details', 'payment_method_display', 'invoice_number', 'patient_name')
        extra_kwargs = {
            'payment_date': {'format': "%Y-%m-%dT%H:%M:%S"},
            'amount': {'min_value': Decimal('0.01')}, # Amount must be positive
        }

    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError(_("Payment amount must be positive."))
        return value

    def validate_recorded_by(self, value):
        if value and value.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise serializers.ValidationError(_("Payments can only be recorded by Admin or Receptionist staff."))
        return value

    def validate(self, data):
        invoice = data.get('invoice', getattr(self.instance, 'invoice', None))
        amount = data.get('amount', getattr(self.instance, 'amount', None))

        if not invoice: # Should be caught by PrimaryKeyRelatedField if creating
             raise serializers.ValidationError({"invoice": _("Invoice is required.")})

        if invoice.status == InvoiceStatus.VOID:
            raise serializers.ValidationError(
                _("Cannot record payment for a voided invoice (%(invoice_number)s).") % {'invoice_number': invoice.invoice_number}
            )

        # Prevent overpayment when creating a new payment
        if not self.instance and amount: # Only on create
            if invoice.status == InvoiceStatus.PAID:
                 raise serializers.ValidationError(
                    _("Invoice %(invoice_number)s is already fully paid.") % {'invoice_number': invoice.invoice_number}
                )
            if amount > invoice.amount_due:
                raise serializers.ValidationError(
                    _("Payment amount (%(payment_amount)s) exceeds amount due (%(amount_due)s) for invoice %(invoice_number)s.") %
                    {'payment_amount': amount, 'amount_due': invoice.amount_due, 'invoice_number': invoice.invoice_number}
                )
        # For updates, the logic is more complex (e.g., if amount is reduced).
        # The invoice.update_invoice_totals_and_status() will handle status recalculation.
        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')
        if 'recorded_by' not in validated_data and request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
                validated_data['recorded_by'] = request.user
        payment = super().create(validated_data)
        # Signal on Payment model will call payment.invoice.update_invoice_totals_and_status()
        return payment

    @transaction.atomic
    def update(self, instance, validated_data):
        payment = super().update(instance, validated_data)
        # Signal on Payment model will call payment.invoice.update_invoice_totals_and_status()
        return payment

class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model.
    Handles creation, updating, and representation of invoices, including nested items.
    """
    patient_details = PatientSerializer(source='patient', read_only=True)
    created_by_details = CustomUserSerializer(source='created_by', read_only=True)
    items = InvoiceItemSerializer(many=True) # Nested serializer for invoice items (writable)
    payments = PaymentSerializer(many=True, read_only=True) # Read-only summary of payments

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    amount_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.select_related('user').filter(user__is_active=True),
        help_text=_("ID of the patient this invoice is for.")
    )
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role__in=[UserRole.ADMIN, UserRole.RECEPTIONIST], is_active=True),
        required=False, allow_null=True,
        help_text=_("ID of the staff member who created this invoice (optional, can be system-assigned).")
    )

    class Meta:
        model = Invoice
        fields = (
            'id', 'patient', 'invoice_number', 'issue_date', 'due_date',
            'total_amount', 'paid_amount', 'status', 'notes', 'created_by',
            'created_at', 'updated_at',
            'patient_details', 'created_by_details',
            'items', 'payments',
            'status_display', 'amount_due', 'is_overdue'
        )
        read_only_fields = (
            'id', 'invoice_number', 'total_amount', 'paid_amount',
            'created_at', 'updated_at',
            'patient_details', 'created_by_details', 'payments',
            'status_display', 'amount_due', 'is_overdue'
        )
        extra_kwargs = {
            'issue_date': {'format': "%Y-%m-%d"},
            'due_date': {'format': "%Y-%m-%d"},
        }

    def validate_created_by(self, value):
        if value and value.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise serializers.ValidationError(_("Invoices can only be created/managed by Admin or Receptionist staff."))
        return value

    def validate(self, data):
        issue_date = data.get('issue_date', getattr(self.instance, 'issue_date', None))
        due_date = data.get('due_date', getattr(self.instance, 'due_date', None))

        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError({"due_date": _("Due date cannot be before the issue date.")})
        
        # Ensure items are provided on create if status is not DRAFT
        if not self.instance and not data.get('items') and data.get('status', InvoiceStatus.DRAFT) != InvoiceStatus.DRAFT:
             raise serializers.ValidationError({"items": _("Invoice items are required unless the invoice is a draft.")})

        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context.get('request')

        if 'created_by' not in validated_data and request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
                validated_data['created_by'] = request.user
        
        # Ensure invoice_number is generated before items are processed if they need it (though they don't directly)
        # The model's save() method handles invoice_number generation.
        invoice = Invoice(**validated_data) # Create instance without saving to DB yet if invoice_number depends on it
        # If invoice_number generation is complex and needs DB state, save invoice first, then items.
        # For now, model's save() handles it.
        invoice.save() # This will generate invoice_number and call update_invoice_totals_and_status (with force_save=False)

        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        
        # After items are created, explicitly update totals and status again to reflect items.
        # The signal from InvoiceItem will also trigger this, but an explicit call ensures it.
        invoice.update_invoice_totals_and_status(force_save=True) # force_save=True to save changes from item calculations
        return invoice

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None) # Items can be optional on update

        # Update main invoice fields
        instance.patient = validated_data.get('patient', instance.patient)
        instance.issue_date = validated_data.get('issue_date', instance.issue_date)
        instance.due_date = validated_data.get('due_date', instance.due_date)
        instance.status = validated_data.get('status', instance.status)
        instance.notes = validated_data.get('notes', instance.notes)

        # Allow admin to change created_by if necessary, though generally not advised.
        if 'created_by' in validated_data and self.context['request'].user.role == UserRole.ADMIN:
            instance.created_by = validated_data.get('created_by', instance.created_by)

        instance.save() # Save main invoice changes. This might call update_invoice_totals_and_status.

        if items_data is not None:
            # Replace existing items with new ones: delete old, create new.
            # This is a common pattern but can be inefficient for minor changes.
            # For more complex item updates (e.g., partial updates to existing items),
            # a more sophisticated approach would be needed (e.g., nested writable serializers with IDs).
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
        
        # Explicitly update totals and status after all changes.
        instance.update_invoice_totals_and_status(force_save=True)
        return instance
