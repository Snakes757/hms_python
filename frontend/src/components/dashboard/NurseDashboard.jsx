// src/components/dashboard/NurseDashboard.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const NurseDashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== 'NURSE') {
    return <p className="text-danger">Access Denied. Nurse role required.</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Nurse Dashboard</h2>
      <p className="lead">Welcome, {user.first_name} {user.last_name}!</p>
      <hr />

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Patient Care</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <Link to="/patients" className="text-decoration-none">View Patient List</Link>
                </li>
                <li className="list-group-item">
                  <Link to="/appointments" className="text-decoration-none">View All Appointments</Link>
                </li>
                <li className="list-group-item">
                  {/* Link to a page/section for recording observations/treatments */}
                  <Link to="/medical/observations" className="text-decoration-none">Log Patient Observation</Link>
                </li>
                 <li className="list-group-item">
                  <Link to="/medical/treatments" className="text-decoration-none">Record Patient Treatment</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">Tasks & Schedule</h5>
              {/* Placeholder for tasks or nurse-specific schedule view */}
              <p className="text-muted"><em>(Assigned tasks, shift schedule, or upcoming critical patient checks will be displayed here.)</em></p>
              <Link to="/appointments?view=nurse_schedule" className="btn btn-outline-primary btn-sm mt-2">My Shift Appointments</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-12 mt-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Important Alerts</h5>
              <p className="text-muted"><em>(Alerts related to patient conditions, medication reminders, etc.)</em></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
