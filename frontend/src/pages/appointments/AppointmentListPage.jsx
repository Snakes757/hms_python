// src/pages/appointments/AppointmentListPage.jsx
import React from 'react';
import AppointmentList from '../../components/appointments/AppointmentList';
import Sidebar from '../../components/common/Sidebar';
import { Link } from 'react-router-dom'; // For "Schedule New" button

const AppointmentListPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Appointments</h1>
          <Link to="/appointments/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Schedule New Appointment
          </Link>
        </div>
        <AppointmentList />
      </div>
    </div>
  );
};

export default AppointmentListPage;
