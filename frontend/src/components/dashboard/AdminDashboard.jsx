// src/components/dashboard/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  // This dashboard can be expanded with key stats, charts, etc.
  // For now, it provides links to major admin sections.
  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>
      <p>Welcome, Administrator! Manage hospital operations and view system reports.</p>
      <hr />
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">User Management</h5>
              <p className="card-text">View, add, edit, and manage all user accounts in the system.</p>
              <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">System Reports</h5>
              <p className="card-text">Access various reports on patient statistics, appointments, financials, and staff activity.</p>
              <Link to="/admin/reports" className="btn btn-primary">View Reports</Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Audit Logs</h5>
              <p className="card-text">Review system audit logs for security and tracking purposes. (Access via Django Admin)</p>
              {/* Link to Django admin if possible, or provide instructions */}
              <a href="/admin/audit_log/auditlogentry/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                View Audit Logs (Django Admin)
              </a>
            </div>
          </div>
        </div>
        {/* Add more cards for other admin functionalities */}
        {/* e.g., System Settings, Billing Overview, etc. */}
      </div>
    </div>
  );
};

export default AdminDashboard;
