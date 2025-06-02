import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants'; // Assuming USER_ROLES is here
import { ArrowRightIcon, DocumentPlusIcon, DocumentTextIcon, BanknotesIcon, ExclamationTriangleIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';


const BillingDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.RECEPTIONIST)) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
        <p className="font-bold">Access Denied</p>
        <p>You do not have permission to view the billing dashboard. Administrator or Receptionist role required.</p>
      </div>
    );
  }

  const FeatureCard = ({ title, children, icon: Icon, iconBgColor = 'bg-sky-100', iconTextColor = 'text-sky-600' }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-2xl">
      <div className="p-6 flex-grow">
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor}`}>
            {Icon && <Icon className={`h-6 w-6 ${iconTextColor}`} aria-hidden="true" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          {children}
        </div>
      </div>
    </div>
  );

  const ActionLink = ({ to, children, className }) => (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-3 text-sm font-medium text-sky-700 bg-sky-50 rounded-lg hover:bg-sky-100 hover:text-sky-800 transition-colors duration-150 ease-in-out ${className}`}
    >
      <span>{children}</span>
      <ArrowRightIcon className="h-4 w-4" />
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-6"> {/* Use Tailwind's container and padding */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Billing Dashboard</h2>
        <p className="mt-1 text-slate-600">Overview of invoicing, payments, and financial summaries.</p>
      </div>
      <hr className="my-6 border-slate-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Billing Actions Card */}
        <FeatureCard title="Billing Actions" icon={DocumentPlusIcon} iconBgColor="bg-blue-100" iconTextColor="text-blue-600">
          <ul className="space-y-3">
            <li>
              <ActionLink to="/billing/invoices/new">Create New Invoice</ActionLink>
            </li>
            <li>
              <ActionLink to="/billing/invoices">View All Invoices</ActionLink>
            </li>
            <li>
              <ActionLink to="/billing/payments/record">Record a Payment</ActionLink>
            </li>
          </ul>
        </FeatureCard>

        {/* Revenue Summary Card */}
        <FeatureCard title="Revenue Summary" icon={BanknotesIcon} iconBgColor="bg-green-100" iconTextColor="text-green-600">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-500 italic text-center">
              (Revenue statistics widget will be displayed here.)
            </p>
            {/* Placeholder for actual revenue data */}
            <div className="mt-3 text-center">
                <p className="text-2xl font-semibold text-green-600">$0.00</p>
                <p className="text-xs text-slate-500">Total Revenue This Month</p>
            </div>
          </div>
          {user.role === USER_ROLES.ADMIN && (
            <div className="mt-4">
              <ActionLink to="/admin/reports/financial-report">
                View Detailed Financial Report
              </ActionLink>
            </div>
          )}
        </FeatureCard>

        {/* Overdue Invoices Card */}
        <FeatureCard title="Overdue Invoices" icon={ExclamationTriangleIcon} iconBgColor="bg-red-100" iconTextColor="text-red-600">
           <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-500 italic text-center">
              (List or count of overdue invoices will be displayed here.)
            </p>
            {/* Placeholder for overdue invoices count */}
             <div className="mt-3 text-center">
                <p className="text-2xl font-semibold text-red-600">0</p>
                <p className="text-xs text-slate-500">Total Overdue Invoices</p>
            </div>
          </div>
          <div className="mt-4">
            <ActionLink to="/billing/invoices?status=OVERDUE">
              View Overdue Invoices
            </ActionLink>
          </div>
        </FeatureCard>

        {/* Additional cards can be added here if needed */}
        {user.role === USER_ROLES.ADMIN && (
          <FeatureCard title="Financial Reports" icon={PresentationChartLineIcon} iconBgColor="bg-purple-100" iconTextColor="text-purple-600">
            <ul className="space-y-3">
              <li>
                <ActionLink to="/admin/reports/financial-report">Overall Financial Summary</ActionLink>
              </li>
              <li>
                <ActionLink to="/admin/reports/appointment-report">Appointment Revenue Report</ActionLink>
              </li>
            </ul>
          </FeatureCard>
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;
