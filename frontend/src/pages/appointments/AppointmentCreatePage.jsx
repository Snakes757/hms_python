// src/pages/appointments/AppointmentCreatePage.jsx
import React from 'react';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import Sidebar from '../../components/common/Sidebar';

const AppointmentCreatePage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Schedule New Appointment</h1>
        <AppointmentForm /> {/* No appointmentId prop means it's for creation */}
      </div>
    </div>
  );
};

export default AppointmentCreatePage;
