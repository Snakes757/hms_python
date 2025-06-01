// src/components/billing/BillingDashboard.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
// Placeholder for widgets or summary components
// import RevenueStatsWidget from '../dashboard/widgets/RevenueStats'; 
// import OverdueInvoicesWidget from './widgets/OverdueInvoicesWidget';

const BillingDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'RECEPTIONIST')) {
    return <p className="text-danger">Access Denied. Admin or Receptionist role required.</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Billing Dashboard</h2>
      <p className="lead">Overview of invoicing and payments.</p>
      <hr />

      <div className="row g-3">
        {/* Quick Actions */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Billing Actions</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <Link to="/billing/invoices/new" className="text-decoration-none">Create New Invoice</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/billing/invoices" className="text-decoration-none">View All Invoices</Link>
                </li>
                {/* <li className="list-group-item">
                  <Link to="/billing/payments/log" className="text-decoration-none">Log Manual Payment</Link>
                </li> */}
              </ul>
            </div>
          </div>
        </div>

        {/* Placeholder for Revenue Statistics */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Revenue Summary</h5>
              {/* <RevenueStatsWidget /> */}
              <p className="text-muted"><em>(Revenue statistics widget will be displayed here.)</em></p>
              {user.role === 'ADMIN' && 
                <Link to="/admin/reports/financial-report" className="btn btn-outline-primary btn-sm mt-2">View Financial Report</Link>
              }
            </div>
          </div>
        </div>
        
        {/* Placeholder for Overdue Invoices */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Overdue Invoices</h5>
              {/* <OverdueInvoicesWidget /> */}
              <p className="text-muted"><em>(List or count of overdue invoices will be displayed here.)</em></p>
               <Link to="/billing/invoices?status=OVERDUE" className="btn btn-outline-danger btn-sm mt-2">View Overdue Invoices</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
