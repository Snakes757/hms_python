import os
from pathlib import Path

# Main project structure
STRUCTURE = {
    "src": {
        "api": {
            "auth.js": None,
            "users.js": None,
            "patients.js": None,
            "medicalRecords.js": None,
            "appointments.js": None,
            "prescriptions.js": None,
            "treatments.js": None,
            "observations.js": None,
            "billing.js": None,
            "telemedicine.js": None,
            "inquiries.js": None,
            "reports.js": None,
            "index.js": None,
        },
        "components": {
            "common": {
                "Header.jsx": None,
                "Footer.jsx": None,
                "Sidebar.jsx": None,
                "LoadingSpinner.jsx": None,
                "ErrorBoundary.jsx": None,
                "ProtectedRoute.jsx": None,
                "RoleBasedRoute.jsx": None,
            },
            "auth": {
                "LoginForm.jsx": None,
                "RegisterForm.jsx": None,
                "ForgotPassword.jsx": None,
                "ResetPassword.jsx": None,
            },
            "dashboard": {
                "AdminDashboard.jsx": None,
                "DoctorDashboard.jsx": None,
                "NurseDashboard.jsx": None,
                "ReceptionistDashboard.jsx": None,
                "PatientDashboard.jsx": None,
                "Widgets": {
                    "AppointmentStats.jsx": None,
                    "PatientStats.jsx": None,
                    "RevenueStats.jsx": None,
                },
            },
            "patients": {
                "PatientList.jsx": None,
                "PatientProfile.jsx": None,
                "PatientForm.jsx": None,
            },
            "medical": {
                "MedicalRecords.jsx": None,
                "RecordForm.jsx": None,
                "Prescriptions.jsx": None,
                "PrescriptionForm.jsx": None,
                "Treatments.jsx": None,
                "TreatmentForm.jsx": None,
                "Observations.jsx": None,
                "ObservationForm.jsx": None,
            },
            "appointments": {
                "AppointmentList.jsx": None,
                "AppointmentCalendar.jsx": None,
                "AppointmentForm.jsx": None,
                "AppointmentDetails.jsx": None,
            },
            "billing": {
                "InvoiceList.jsx": None,
                "InvoiceDetails.jsx": None,
                "PaymentForm.jsx": None,
                "BillingDashboard.jsx": None,
            },
            "telemedicine": {
                "TelemedicineList.jsx": None,
                "TelemedicineSession.jsx": None,
                "TelemedicineForm.jsx": None,
            },
            "inquiries": {
                "InquiryList.jsx": None,
                "InquiryForm.jsx": None,
                "InquiryDetails.jsx": None,
            },
            "reports": {
                "PatientStatistics.jsx": None,
                "AppointmentReport.jsx": None,
                "FinancialReport.jsx": None,
                "StaffActivityReport.jsx": None,
            },
        },
        "context": {
            "AuthContext.jsx": None,
            "UserContext.jsx": None,
        },
        "hooks": {
            "useAuth.js": None,
            "useApi.js": None,
            "usePermissions.js": None,
        },
        "pages": {
            "Home.jsx": None,
            "Login.jsx": None,
            "Register.jsx": None,
            "NotFound.jsx": None,
            "Unauthorized.jsx": None,
            "patients": {
                "PatientListPage.jsx": None,
                "PatientProfilePage.jsx": None,
            },
            "medical": {
                "MedicalRecordsPage.jsx": None,
                "PrescriptionsPage.jsx": None,
                "TreatmentsPage.jsx": None,
                "ObservationsPage.jsx": None,
            },
            "appointments": {
                "AppointmentListPage.jsx": None,
                "AppointmentCreatePage.jsx": None,
                "AppointmentDetailsPage.jsx": None,
            },
            "billing": {
                "InvoiceListPage.jsx": None,
                "InvoiceDetailsPage.jsx": None,
                "PaymentPage.jsx": None,
            },
            "telemedicine": {
                "TelemedicineListPage.jsx": None,
                "TelemedicineSessionPage.jsx": None,
            },
            "inquiries": {
                "InquiryListPage.jsx": None,
                "InquiryCreatePage.jsx": None,
                "InquiryDetailsPage.jsx": None,
            },
            "reports": {
                "ReportsDashboardPage.jsx": None,
                "PatientStatisticsPage.jsx": None,
                "AppointmentReportPage.jsx": None,
                "FinancialReportPage.jsx": None,
                "StaffActivityReportPage.jsx": None,
            },
            "profile": {
                "UserProfilePage.jsx": None,
                "ProfileSettingsPage.jsx": None,
            },
        },
        "routes": {
            "AppRoutes.jsx": None,
            "AdminRoutes.jsx": None,
            "DoctorRoutes.jsx": None,
            "NurseRoutes.jsx": None,
            "ReceptionistRoutes.jsx": None,
            "PatientRoutes.jsx": None,
            "PublicRoutes.jsx": None,
        },
        "styles": {
            "theme.js": None,
            "global.css": None,
            "components": {
                "buttons.css": None,
                "forms.css": None,
                "tables.css": None,
                "cards.css": None,
            },
        },
        "utils": {
            "auth.js": None,
            "api.js": None,
            "validators.js": None,
            "formatters.js": None,
            "constants.js": None,
            "rolePermissions.js": None,
        },
        "App.jsx": None,
        "index.jsx": None,
    },
    "public": {
        "index.html": None,
        "favicon.ico": None,
        "assets": {
            "images": None,
            "fonts": None,
        },
    },
    ".env": None,
    ".env.example": None,
    "package.json": None,
    "README.md": None,
}


def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if content is None:  # It's a file
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            Path(path).touch()
            print(f"Created file: {path}")
        else:  # It's a directory
            os.makedirs(path, exist_ok=True)
            print(f"Created directory: {path}")
            create_structure(path, content)


def generate_react_project(project_name="hms-frontend"):
    print(f"Generating React project structure for: {project_name}")
    os.makedirs(project_name, exist_ok=True)
    create_structure(project_name, STRUCTURE)
    print(f"\nReact project structure generated successfully in '{project_name}' directory!")
    print("\nNext steps:")
    print("1. cd into the project directory")
    print("2. Run 'npm install' to install dependencies")
    print("3. Start developing your Hospital Management System frontend!")


if __name__ == "__main__":
    project_name = input("Enter project name (default: hms-frontend): ") or "hms-frontend"
    generate_react_project(project_name)