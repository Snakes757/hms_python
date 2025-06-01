# billing/urls.py
from django.urls import path
from .views import (
    InvoiceListCreateAPIView,
    InvoiceDetailAPIView,
    PaymentListCreateAPIView,
    PaymentDetailAPIView,
    # Add other billing-related views here if any, e.g., for payment methods, reports.
)

app_name = 'billing'  # Namespace for these URLs

urlpatterns = [
    # Invoice Endpoints
    # List all invoices (GET) or create a new invoice (POST).
    path('invoices/', InvoiceListCreateAPIView.as_view(), name='invoice-list-create'),
    # Retrieve (GET), update (PUT/PATCH), or delete/void (DELETE) a specific invoice.
    path('invoices/<int:id>/', InvoiceDetailAPIView.as_view(), name='invoice-detail'),

    # Payment Endpoints (nested under invoices)
    # List all payments for a specific invoice (GET) or record a new payment for it (POST).
    path('invoices/<int:invoice_id>/payments/', PaymentListCreateAPIView.as_view(), name='invoice-payment-list-create'),
    # Retrieve (GET), update (PUT/PATCH), or delete (DELETE) a specific payment for an invoice.
    path('invoices/<int:invoice_id>/payments/<int:payment_id>/', PaymentDetailAPIView.as_view(), name='invoice-payment-detail'),
]
