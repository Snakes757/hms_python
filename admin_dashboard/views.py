from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Q, F
from django.db.models.functions import TruncDate, TruncMonth
from django.http import HttpResponse
import csv
from datetime import timedelta, datetime

# Import models from their respective apps
from patients.models import Patient # Removed MedicalRecord as it's not directly used in this view's queries
from appointments.models import Appointment, AppointmentStatus, AppointmentType
from billing.models import Invoice, InvoiceStatus, Payment, PaymentMethod
from users.models import CustomUser, UserRole

# Import serializers if creating API views for models in this app
# from .serializers import DashboardPreferenceSerializer
# from .models import DashboardPreference

class IsHospitalAdmin(permissions.BasePermission):
    """
    Custom permission to only allow access to hospital administrators.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN

class ReportListView(views.APIView):
    """
    Lists all available reports in the admin dashboard.
    Provides report names, endpoints, and descriptions.
    """
    permission_classes = [IsHospitalAdmin]

    def get(self, request, *args, **kwargs):
        available_reports = [
            {'name': 'Patient Statistics Report', 'endpoint': 'admin_dashboard:report_patient_statistics', 'description': 'Summary of patient demographics and registration trends. Add "?format=csv" for CSV download.'},
            {'name': 'Appointment Report', 'endpoint': 'admin_dashboard:report_appointment', 'description': 'Overview of appointment statuses, types, and scheduling. Add "?format=csv&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD" for CSV download within a date range.'},
            {'name': 'Billing and Financial Report', 'endpoint': 'admin_dashboard:report_financial', 'description': 'Summary of invoices, payments, and outstanding amounts. Add "?format=csv&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD" for CSV download within a date range.'},
            {'name': 'Staff Activity Report', 'endpoint': 'admin_dashboard:report_staff_activity', 'description': 'Overview of staff roles and system activity (basic counts).'},
        ]
        return Response(available_reports)

class BaseReportView(views.APIView):
    """
    Base class for report views to handle common CSV export logic.
    """
    permission_classes = [IsHospitalAdmin]

    def get_report_data(self, request):
        """
        Placeholder for report data generation. Must be implemented by subclasses.
        """
        raise NotImplementedError("Subclasses must implement get_report_data.")

    def get_csv_headers(self):
        """
        Placeholder for CSV headers. Must be implemented by subclasses for detailed CSV.
        """
        raise NotImplementedError("Subclasses must implement get_csv_headers for detailed CSV.")

    def get_csv_row(self, item):
        """
        Placeholder for formatting a single CSV row. Must be implemented by subclasses for detailed CSV.
        """
        raise NotImplementedError("Subclasses must implement get_csv_row for detailed CSV.")

    def _write_summary_to_csv(self, writer, report_data):
        """
        Writes common summary metrics to the CSV.
        Subclasses can override or extend this.
        """
        writer.writerow([report_data.get('report_title', 'Report')])
        writer.writerow(['Generated At', report_data.get('report_generated_at', timezone.now()).strftime('%Y-%m-%d %H:%M:%S')])
        if report_data.get('filters_applied'):
            writer.writerow(['Filters Applied', str(report_data.get('filters_applied'))])
        writer.writerow([]) # Blank line

    def _write_detailed_data_to_csv(self, writer, report_data, data_key):
        """
        Writes detailed data list to CSV.
        """
        detailed_data = report_data.get(data_key, [])
        if detailed_data:
            headers = self.get_csv_headers()
            writer.writerow(headers)
            for item in detailed_data:
                writer.writerow(self.get_csv_row(item))
            writer.writerow([]) # Blank line after section


    def get(self, request, *args, **kwargs):
        try:
            report_data = self.get_report_data(request)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except NotImplementedError as e:
             return Response({"error": f"Report configuration error: {str(e)}"}, status=status.HTTP_501_NOT_IMPLEMENTED)


        export_format = request.query_params.get('format')
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{report_data.get("report_title", "report").lower().replace(" ", "_")}_{timezone.now().strftime("%Y%m%d")}.csv"'
            writer = csv.writer(response)
            self._write_summary_to_csv(writer, report_data) # Common summary

            # Specific sections - subclasses should manage this part more granularly
            # This is a generic example; specific reports will have more tailored CSV structures.
            for key, value in report_data.items():
                if isinstance(value, list) and key not in ['raw_data_for_csv']: # Avoid double printing raw data if handled by _write_detailed_data_to_csv
                    if value and isinstance(value[0], dict): # Simple list of dicts
                        writer.writerow([key.replace('_', ' ').title()])
                        headers = list(value[0].keys())
                        writer.writerow([h.replace('_', ' ').title() for h in headers])
                        for item in value:
                            writer.writerow([str(item.get(h, '')) for h in headers])
                        writer.writerow([])
            
            # Example for a specific detailed data section if 'raw_data_for_csv' exists
            if 'raw_data_for_csv' in report_data and hasattr(self, 'get_csv_headers') and hasattr(self, 'get_csv_row'):
                 try:
                    self._write_detailed_data_to_csv(writer, report_data, 'raw_data_for_csv')
                 except NotImplementedError:
                     # If detailed methods are not implemented, this section is skipped for generic CSV.
                     pass

            return response
        return Response(report_data)


class PatientStatisticsReportView(BaseReportView):
    """
    Generates a report on patient statistics including demographics and registration trends.
    Supports JSON and CSV export.
    """
    def get_report_data(self, request):
        total_patients = Patient.objects.count()
        patients_by_gender = Patient.objects.values('gender').annotate(count=Count('user_id')).order_by('gender')

        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_registrations = Patient.objects.filter(user__date_joined__date__gte=thirty_days_ago)\
            .annotate(date=TruncDate('user__date_joined'))\
            .values('date')\
            .annotate(count=Count('user_id'))\
            .order_by('date')

        current_year = timezone.now().year
        registrations_by_month = Patient.objects.filter(user__date_joined__year=current_year)\
            .annotate(month=TruncMonth('user__date_joined'))\
            .values('month')\
            .annotate(count=Count('user_id'))\
            .order_by('month')

        age_groups = {'under_18': 0, '18_40': 0, '41_60': 0, 'over_60': 0, 'unknown_age': 0}
        today = timezone.now().date()
        for patient in Patient.objects.filter(date_of_birth__isnull=False).select_related('user'):
            if patient.date_of_birth:
                age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
                if age < 18: age_groups['under_18'] += 1
                elif age <= 40: age_groups['18_40'] += 1
                elif age <= 60: age_groups['41_60'] += 1
                else: age_groups['over_60'] += 1
        age_groups['unknown_age'] = Patient.objects.filter(date_of_birth__isnull=True).count()

        return {
            'report_title': 'Patient Statistics Report',
            'report_generated_at': timezone.now(),
            'total_patients': total_patients,
            'patients_by_gender': list(patients_by_gender),
            'recent_registrations_last_30_days': list(recent_registrations),
            'registrations_by_month_current_year': list(registrations_by_month),
            'patient_age_distribution': age_groups,
        }
    
    # Override _write_summary_to_csv for more specific formatting if needed, or rely on BaseReportView's generic loop.
    # For this report, the generic loop in BaseReportView might be sufficient for the JSON structure.

class AppointmentReportView(BaseReportView):
    """
    Generates a report on appointments, including statuses, types, and scheduling trends.
    Supports date filtering and JSON/CSV export.
    """
    def get_report_data(self, request):
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')
        queryset = Appointment.objects.select_related('doctor', 'patient__user').all()
        date_filter_applied_label = "all time (default last 30 days if no dates specified)"

        date_from, date_to = None, None
        if date_from_str:
            try: date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            except ValueError: raise ValueError("Invalid date_from format. Use YYYY-MM-DD.")
        if date_to_str:
            try: date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
            except ValueError: raise ValueError("Invalid date_to format. Use YYYY-MM-DD.")

        if date_from and date_to:
            queryset = queryset.filter(appointment_date_time__date__range=[date_from, date_to])
            date_filter_applied_label = f"{date_from_str} to {date_to_str}"
        elif date_from:
            queryset = queryset.filter(appointment_date_time__date__gte=date_from)
            date_filter_applied_label = f"from {date_from_str}"
        elif date_to:
            queryset = queryset.filter(appointment_date_time__date__lte=date_to)
            date_filter_applied_label = f"up to {date_to_str}"
        else: # Default to last 30 days if no specific range
            thirty_days_ago = timezone.now() - timedelta(days=30)
            queryset = queryset.filter(appointment_date_time__gte=thirty_days_ago)
            date_filter_applied_label = "last 30 days"
        
        total_appointments = queryset.count()
        appointments_by_status = queryset.values('status').annotate(count=Count('id')).order_by('status')
        appointments_by_type = queryset.values('appointment_type').annotate(count=Count('id')).order_by('appointment_type')
        
        appointments_per_doctor = queryset.filter(doctor__isnull=False)\
            .values('doctor__email', 'doctor__first_name', 'doctor__last_name')\
            .annotate(count=Count('id'))\
            .order_by('-count')
            
        appointments_by_date = queryset.annotate(date=TruncDate('appointment_date_time'))\
            .values('date')\
            .annotate(count=Count('id'))\
            .order_by('date')

        # Prepare detailed data for CSV
        raw_data_for_csv = list(queryset.values(
            'id', 'patient__user__first_name', 'patient__user__last_name', 'patient__user__email',
            'doctor__first_name', 'doctor__last_name', 'doctor__email',
            'appointment_type', 'appointment_date_time', 'status', 'reason'
        ))

        return {
            'report_title': 'Appointment Report',
            'report_generated_at': timezone.now(),
            'filters_applied': {'period': date_filter_applied_label, 'date_from': date_from_str, 'date_to': date_to_str},
            'total_appointments_in_period': total_appointments,
            'appointments_by_status': [{'status': AppointmentStatus(s['status']).label if s['status'] else 'N/A', 'count': s['count']} for s in appointments_by_status],
            'appointments_by_type': [{'type': AppointmentType(t['appointment_type']).label if t['appointment_type'] else 'N/A', 'count': t['count']} for t in appointments_by_type],
            'appointments_per_doctor': list(appointments_per_doctor),
            'appointments_by_date_in_period': list(appointments_by_date),
            'raw_data_for_csv': raw_data_for_csv
        }

    def get_csv_headers(self):
        return ['ID', 'Patient First Name', 'Patient Last Name', 'Patient Email',
                'Doctor First Name', 'Doctor Last Name', 'Doctor Email',
                'Type', 'Date & Time', 'Status', 'Reason']

    def get_csv_row(self, item):
        return [
            item.get('id'), item.get('patient__user__first_name'), item.get('patient__user__last_name'), item.get('patient__user__email'),
            item.get('doctor__first_name'), item.get('doctor__last_name'), item.get('doctor__email'),
            AppointmentType(item.get('appointment_type')).label if item.get('appointment_type') else 'N/A',
            item.get('appointment_date_time').strftime('%Y-%m-%d %H:%M') if item.get('appointment_date_time') else 'N/A',
            AppointmentStatus(item.get('status')).label if item.get('status') else 'N/A',
            item.get('reason')
        ]

class FinancialReportView(BaseReportView):
    """
    Generates a financial report including revenue, outstanding invoices, and payment methods.
    Supports date filtering and JSON/CSV export.
    """
    def get_report_data(self, request):
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        invoice_queryset_period = Invoice.objects.select_related('patient__user', 'created_by').all()
        payment_queryset_period = Payment.objects.select_related('invoice__patient__user', 'recorded_by').all()
        date_filter_applied_label = "all time (default last 30 days if no dates specified)"
        
        date_from, date_to = None, None
        if date_from_str:
            try: date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            except ValueError: raise ValueError("Invalid date_from format. Use YYYY-MM-DD.")
        if date_to_str:
            try: date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
            except ValueError: raise ValueError("Invalid date_to format. Use YYYY-MM-DD.")

        if date_from and date_to:
            invoice_queryset_period = invoice_queryset_period.filter(issue_date__range=[date_from, date_to])
            payment_queryset_period = payment_queryset_period.filter(payment_date__date__range=[date_from, date_to])
            date_filter_applied_label = f"{date_from_str} to {date_to_str}"
        elif date_from:
            invoice_queryset_period = invoice_queryset_period.filter(issue_date__gte=date_from)
            payment_queryset_period = payment_queryset_period.filter(payment_date__date__gte=date_from)
            date_filter_applied_label = f"from {date_from_str}"
        elif date_to:
            invoice_queryset_period = invoice_queryset_period.filter(issue_date__lte=date_to)
            payment_queryset_period = payment_queryset_period.filter(payment_date__date__lte=date_to)
            date_filter_applied_label = f"up to {date_to_str}"
        else: # Default to last 30 days
            thirty_days_ago_date = timezone.now().date() - timedelta(days=30)
            invoice_queryset_period = invoice_queryset_period.filter(issue_date__gte=thirty_days_ago_date)
            payment_queryset_period = payment_queryset_period.filter(payment_date__date__gte=thirty_days_ago_date)
            date_filter_applied_label = "last 30 days"

        total_revenue_in_period = payment_queryset_period.aggregate(total=Sum('amount'))['total'] or 0
        outstanding_invoices_all_time = Invoice.objects.filter(
            Q(status=InvoiceStatus.SENT) | Q(status=InvoiceStatus.PARTIALLY_PAID) | Q(status=InvoiceStatus.OVERDUE)
        )
        total_outstanding_amount_all_time = sum(inv.amount_due for inv in outstanding_invoices_all_time)
        invoices_by_status_period = invoice_queryset_period.values('status').annotate(count=Count('id'), total_value=Sum('total_amount')).order_by('status')
        payments_by_method_period = payment_queryset_period.values('payment_method').annotate(count=Count('id'), total_paid=Sum('amount')).order_by('payment_method')

        raw_invoice_data_csv = list(invoice_queryset_period.values(
            'invoice_number', 'patient__user__first_name', 'patient__user__last_name',
            'issue_date', 'due_date', 'total_amount', 'paid_amount', 'status'
        ))
        raw_payment_data_csv = list(payment_queryset_period.values(
            'id', 'invoice__invoice_number', 'payment_date', 'amount', 'payment_method', 'transaction_id',
            'recorded_by__first_name', 'recorded_by__last_name'
        ))

        return {
            'report_title': 'Financial Report',
            'report_generated_at': timezone.now(),
            'filters_applied': {'period': date_filter_applied_label, 'date_from': date_from_str, 'date_to': date_to_str},
            'total_revenue_in_period': f"{total_revenue_in_period:.2f}",
            'total_outstanding_revenue_all_time': f"{total_outstanding_amount_all_time:.2f}",
            'invoices_by_status_in_period': [{'status': InvoiceStatus(s['status']).label if s['status'] else 'N/A', 'count': s['count'], 'total_value': f"{s.get('total_value', 0):.2f}"} for s in invoices_by_status_period],
            'payments_by_method_in_period': [{'method': PaymentMethod(p['payment_method']).label if p['payment_method'] else 'N/A', 'count': p['count'], 'total_paid': f"{p.get('total_paid', 0):.2f}"} for p in payments_by_method_period],
            'raw_invoice_data_csv': raw_invoice_data_csv, # For specific CSV handling
            'raw_payment_data_csv': raw_payment_data_csv   # For specific CSV handling
        }

    def get(self, request, *args, **kwargs): # Override get for custom CSV structure
        try:
            report_data = self.get_report_data(request)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        export_format = request.query_params.get('format')
        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{report_data["report_title"].lower().replace(" ", "_")}_{timezone.now().strftime("%Y%m%d")}.csv"'
            writer = csv.writer(response)
            self._write_summary_to_csv(writer, report_data)

            writer.writerow(['Summary Metric', 'Value'])
            writer.writerow(['Total Revenue in Period', report_data['total_revenue_in_period']])
            writer.writerow(['Total Outstanding Revenue (All Time)', report_data['total_outstanding_revenue_all_time']])
            writer.writerow([])

            writer.writerow(['Invoices by Status (Period)'])
            writer.writerow(['Status', 'Count', 'Total Value'])
            for item in report_data['invoices_by_status_in_period']:
                writer.writerow([item['status'], item['count'], item['total_value']])
            writer.writerow([])

            writer.writerow(['Payments by Method (Period)'])
            writer.writerow(['Method', 'Count', 'Total Paid'])
            for item in report_data['payments_by_method_in_period']:
                writer.writerow([item['method'], item['count'], item['total_paid']])
            writer.writerow([])
            
            writer.writerow(['Detailed Invoice List for Period'])
            writer.writerow(['Invoice Number', 'Patient First Name', 'Patient Last Name', 'Issue Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Status'])
            for inv in report_data['raw_invoice_data_csv']:
                writer.writerow([
                    inv['invoice_number'], inv['patient__user__first_name'], inv['patient__user__last_name'],
                    inv['issue_date'].strftime('%Y-%m-%d') if inv['issue_date'] else 'N/A',
                    inv['due_date'].strftime('%Y-%m-%d') if inv['due_date'] else 'N/A',
                    f"{inv['total_amount']:.2f}", f"{inv['paid_amount']:.2f}",
                    InvoiceStatus(inv['status']).label if inv['status'] else 'N/A'
                ])
            writer.writerow([])

            writer.writerow(['Detailed Payment List for Period'])
            writer.writerow(['Payment ID', 'Invoice Number', 'Payment Date', 'Amount', 'Method', 'Transaction ID', 'Recorded By First Name', 'Recorded By Last Name'])
            for pay in report_data['raw_payment_data_csv']:
                writer.writerow([
                    pay['id'], pay['invoice__invoice_number'],
                    pay['payment_date'].strftime('%Y-%m-%d %H:%M') if pay['payment_date'] else 'N/A',
                    f"{pay['amount']:.2f}",
                    PaymentMethod(pay['payment_method']).label if pay['payment_method'] else 'N/A',
                    pay['transaction_id'],
                    pay['recorded_by__first_name'], pay['recorded_by__last_name']
                ])
            return response
        return Response(report_data)


class StaffActivityReportView(BaseReportView):
    """
    Generates a basic report on staff activity, currently showing staff counts by role.
    """
    def get_report_data(self, request):
        staff_by_role = CustomUser.objects.filter(role__in=[UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST])\
            .values('role').annotate(count=Count('id')).order_by('role')

        return {
            'report_title': 'Staff Activity Report',
            'report_generated_at': timezone.now(),
            'message': 'Staff Activity Report - Basic staff counts. Detailed activity logging requires further implementation (e.g., audit log integration).',
            'staff_counts_by_role': [{'role': UserRole(s['role']).label, 'count': s['count']} for s in staff_by_role],
        }
    # CSV for this report will be handled by the BaseReportView's generic loop.

# If you add views for DashboardPreference:
# class DashboardPreferenceDetailView(generics.RetrieveUpdateAPIView):
#     serializer_class = DashboardPreferenceSerializer
#     permission_classes = [IsHospitalAdmin] # Or a more specific permission
#
#     def get_object(self):
#         # Get or create preferences for the requesting admin user
#         obj, created = DashboardPreference.objects.get_or_create(user=self.request.user)
#         return obj
