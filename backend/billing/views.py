# billing/views.py
from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.db import transaction

from .models import Invoice, Payment, InvoiceStatus
from .serializers import InvoiceSerializer, PaymentSerializer
from users.models import UserRole
from patients.models import Patient # For type checking and queryset filtering

from audit_log.models import AuditLogAction # create_audit_log_entry is handled by signals

class IsAdminOrReceptionist(permissions.BasePermission):
    """
    Allows access only to Admin or Receptionist users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]

class CanAccessInvoice(permissions.BasePermission):
    """
    Permission to control access to specific Invoice objects.
    - Patient: Read-only for their own invoices.
    - Staff (Admin, Receptionist): Full access.
    - Staff (Doctor, Nurse): Read-only access.
    """
    def has_object_permission(self, request, view, obj): # obj is an Invoice instance
        user = request.user
        if not user or not user.is_authenticated: return False

        if user.role == UserRole.PATIENT:
            return obj.patient.user == user # Patient can only access their own invoice (all methods if allowed by view)
                                            # View itself will limit methods (e.g. patient cannot PUT/DELETE)

        if user.role in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            return True # Full access for admin/receptionist

        if user.role in [UserRole.DOCTOR, UserRole.NURSE]:
            return request.method in permissions.SAFE_METHODS # Read-only for doctor/nurse

        return False

class CanAccessPayment(permissions.BasePermission):
    """
    Permission to control access to specific Payment objects, based on access to parent invoice.
    """
    def has_object_permission(self, request, view, obj): # obj is a Payment instance
        user = request.user
        if not user or not user.is_authenticated: return False
        # Check permission on the payment's invoice
        return CanAccessInvoice().has_object_permission(request, view, obj.invoice)


class InvoiceListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating invoices.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated] # Base permission, further checks below
    filterset_fields = ['patient__user__id', 'status', 'issue_date', 'due_date']
    search_fields = ['invoice_number', 'patient__user__first_name', 'patient__user__last_name', 'patient__user__email']


    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related(
            'patient__user', 'created_by'
        ).prefetch_related(
            'items__appointment', 'items__treatment', 'items__prescription', 'payments__recorded_by'
        ).all()

        if user.role == UserRole.PATIENT:
            patient_profile = Patient.objects.filter(user=user).first()
            queryset = queryset.filter(patient=patient_profile) if patient_profile else Invoice.objects.none()
        elif user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE]:
            # If user role is not one of the above staff roles, and not a patient, deny access.
            return Invoice.objects.none()
        # Staff (Admin, Receptionist, Doctor, Nurse) can see all by default, further filtered by query_params.
        return queryset.order_by('-issue_date')

    def perform_create(self, serializer):
        if self.request.user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise permissions.PermissionDenied(_("Only Admin or Receptionist staff can create invoices."))
        # Audit logging for CREATED is handled by signals.py based on AUDITED_MODELS_CRUD
        serializer.save(created_by=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class InvoiceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and voiding (DELETE) a specific invoice.
    """
    queryset = Invoice.objects.select_related('patient__user', 'created_by').prefetch_related('items', 'payments').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessInvoice]
    lookup_field = 'id'

    def perform_update(self, serializer):
        if self.request.user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise permissions.PermissionDenied(_("Only Admin or Receptionist staff can update invoices."))
        # Audit logging for UPDATED is handled by signals.py
        serializer.save()

    def perform_destroy(self, instance): # This method effectively "voids" the invoice
        if self.request.user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise permissions.PermissionDenied(_("Only Admin or Receptionist staff can void invoices."))

        if instance.status == InvoiceStatus.PAID or \
           (instance.status == InvoiceStatus.PARTIALLY_PAID and instance.payments.exists()):
            raise drf_serializers.ValidationError(
                _("Cannot void an invoice that has payments recorded. "
                  "Consider refunding payments first or contact an administrator for assistance.")
            )

        if instance.status != InvoiceStatus.VOID:
            instance.status = InvoiceStatus.VOID
            instance.save(update_fields=['status']) # Signal will log this status update
            serializer = self.get_serializer(instance) # Get updated instance data
            return Response(serializer.data, status=status.HTTP_200_OK) # Return voided invoice
        else: # Already void
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK) # Return already voided invoice
            # Or raise ValidationError: raise drf_serializers.ValidationError(_("Invoice is already void."))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class PaymentListCreateAPIView(generics.ListCreateAPIView):
    """
    API endpoint for listing payments for a specific invoice and recording new payments.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated] # Further checks in get_invoice

    def get_invoice(self):
        invoice_id = self.kwargs.get('invoice_id')
        invoice = get_object_or_404(Invoice.objects.select_related('patient__user'), id=invoice_id)
        # Check if the current user can access this invoice (and thus its payments)
        if not CanAccessInvoice().has_object_permission(self.request, self, invoice):
            raise permissions.PermissionDenied(_("You do not have permission to access this invoice's payments."))
        return invoice

    def get_queryset(self):
        invoice = self.get_invoice()
        return Payment.objects.filter(invoice=invoice).select_related('invoice', 'recorded_by').order_by('-payment_date')

    def perform_create(self, serializer):
        if self.request.user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise permissions.PermissionDenied(_("Only Admin or Receptionist staff can record payments."))
        invoice = self.get_invoice() # Get invoice again for validation before saving payment
        # Serializer's validate method already checks for voided status and overpayment.
        # Audit logging for CREATED is handled by signals.py
        serializer.save(invoice=invoice, recorded_by=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        # context['invoice'] = self.get_invoice() # Pass invoice to serializer if needed for validation
        return context

class PaymentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific payment.
    """
    queryset = Payment.objects.select_related('invoice__patient__user', 'recorded_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, CanAccessPayment]
    lookup_url_kwarg = 'payment_id'

    def get_object(self):
        invoice_id = self.kwargs.get('invoice_id')
        payment_id = self.kwargs.get(self.lookup_url_kwarg)
        # Ensure payment belongs to the specified invoice
        payment = get_object_or_404(self.get_queryset(), id=payment_id, invoice__id=invoice_id)
        self.check_object_permissions(self.request, payment) # Runs CanAccessPayment
        return payment

    def perform_update(self, serializer):
        if self.request.user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise permissions.PermissionDenied(_("Only Admin or Receptionist staff can update payments."))
        # Audit logging for UPDATED is handled by signals.py
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in [UserRole.ADMIN, UserRole.RECEPTIONIST]:
            raise permissions.PermissionDenied(_("Only Admin or Receptionist staff can delete payments."))
        # Audit logging for DELETED is handled by signals.py
        # The signal on Payment model will trigger invoice total/status update.
        super().perform_destroy(instance)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
