// src/components/dashboard/DoctorDashboard.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
// Placeholder for actual data fetching and display components
// import TodaysAppointmentsWidget from './widgets/TodaysAppointmentsWidget'; 
// import RecentPatientActivityWidget from './widgets/RecentPatientActivityWidget';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== 'DOCTOR') {
    return <p className="text-danger">Access Denied. Doctor role required.</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Doctor Dashboard</h2>
      <p className="lead">Welcome, Dr. {user.first_name} {user.last_name}!</p>
      <hr />

      <div className="row g-3">
        {/* Quick Actions */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <Link to="/appointments" className="text-decoration-none">View My Schedule</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/patients" className="text-decoration-none">Search Patients</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/appointments/new" className="text-decoration-none">Schedule New Appointment</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/telemedicine/sessions" className="text-decoration-none">View Telemedicine Sessions</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Placeholder for Today's Appointments */}
        <div className="col-md-8">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Today's Appointments</h5>
              {/* <TodaysAppointmentsWidget doctorId={user.id} /> */}
              <p className="text-muted"><em>(Today's appointments widget will be displayed here.)</em></p>
              <Link to="/appointments?date=today" className="btn btn-outline-primary btn-sm mt-2">View Full Schedule</Link>
            </div>
          </div>
        </div>

        {/* Placeholder for Recent Patient Activity or Messages */}
        <div className="col-md-12 mt-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Recent Patient Interactions</h5>
              {/* <RecentPatientActivityWidget doctorId={user.id} /> */}
              <p className="text-muted"><em>(Recent patient records accessed or updated, new messages, etc., will be displayed here.)</em></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
