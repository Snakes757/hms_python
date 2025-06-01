// src/components/dashboard/ReceptionistDashboard.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ReceptionistDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== 'RECEPTIONIST') {
    return <p className="text-danger">Access Denied. Receptionist role required.</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Receptionist Dashboard</h2>
      <p className="lead">Welcome, {user.first_name} {user.last_name}!</p>
      <hr />

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Patient Management</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <Link to="/register" className="text-decoration-none">Register New Patient</Link> 
                  {/* Note: /register is public. Admin/Receptionist might have a more detailed internal form or use this. */}
                </li>
                <li className="list-group-item">
                  <Link to="/patients" className="text-decoration-none">Search & View Patients</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Appointments</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <Link to="/appointments/new" className="text-decoration-none">Schedule New Appointment</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/appointments" className="text-decoration-none">View Appointment Calendar/List</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Inquiries & Billing</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <Link to="/inquiries" className="text-decoration-none">Manage Inquiries</Link>
                </li>
                 <li className="list-group-item">
                  <Link to="/inquiries/new" className="text-decoration-none">Log New Inquiry</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/billing/invoices" className="text-decoration-none">Manage Invoices</Link>
                </li>
                 <li className="list-group-item">
                  <Link to="/billing/invoices/new" className="text-decoration-none">Create New Invoice</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
