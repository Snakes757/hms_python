// src/components/dashboard/PatientDashboard.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const PatientDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== 'PATIENT') {
    return <p className="text-danger">Access Denied. Patient role required.</p>;
  }

  // Placeholder data - In a real app, this would come from API calls
  const upcomingAppointmentsCount = 0; // Example: fetch upcoming appointments
  const unreadMessagesCount = 0;       // Example: fetch unread messages

  return (
    <div className="container mt-4">
      <h2>Patient Dashboard</h2>
      <p className="lead">Welcome, {user.first_name} {user.last_name}!</p>
      <hr />

      <div className="row g-3">
        {/* Key Information Summary */}
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card text-white bg-primary shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Upcoming Appointments</h5>
              {upcomingAppointmentsCount > 0 ? (
                <p className="card-text fs-4">{upcomingAppointmentsCount}</p>
              ) : (
                <p className="card-text">No upcoming appointments.</p>
              )}
              <Link to="/appointments" className="btn btn-light btn-sm">View Appointments</Link>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card text-white bg-info shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">My Medical Records</h5>
              <p className="card-text">Access your health history, test results, and more.</p>
              <Link to={`/patients/${user.id}`} className="btn btn-light btn-sm">View My Records</Link> 
              {/* Assuming /patients/:userId shows profile with medical records */}
            </div>
          </div>
        </div>
        
        <div className="col-md-6 col-lg-4 mb-3">
          <div className="card text-dark bg-light shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">My Profile</h5>
              <p className="card-text">View and update your personal information.</p>
              <Link to="/profile/me" className="btn btn-secondary btn-sm">View/Edit Profile</Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-lg-12">
           <div className="card shadow-sm">
            <div className="card-header">
                Quick Actions
            </div>
            <div className="card-body">
                 <Link to="/appointments/new" className="btn btn-success me-2 mb-2">Schedule New Appointment</Link>
                 <Link to="/telemedicine/sessions/new" className="btn btn-info me-2 mb-2">Book Telemedicine Session</Link>
                 <Link to="/inquiries/new" className="btn btn-warning me-2 mb-2">Submit an Inquiry</Link>
                 <Link to="/billing/invoices" className="btn btn-outline-primary mb-2">View My Invoices</Link>
            </div>
           </div>
        </div>


        {/* Placeholder for Unread Messages or Notifications */}
        {/* <div className="col-md-12 mt-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Notifications</h5>
              {unreadMessagesCount > 0 ? (
                <p>You have {unreadMessagesCount} unread messages.</p>
              ) : (
                <p className="text-muted">No new notifications.</p>
              )}
              <Link to="/messages" className="btn btn-outline-primary btn-sm">View Messages</Link>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default PatientDashboard;
