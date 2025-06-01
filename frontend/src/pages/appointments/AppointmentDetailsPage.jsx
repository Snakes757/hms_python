// src/pages/appointments/AppointmentDetailsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import AppointmentDetails from '../../components/appointments/AppointmentDetails';
import Sidebar from '../../components/common/Sidebar';

const AppointmentDetailsPage = () => {
  const { appointmentId } = useParams(); // Get appointmentId from URL

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <AppointmentDetails appointmentId={appointmentId} />
      </div>
    </div>
  );
};

export default AppointmentDetailsPage;
