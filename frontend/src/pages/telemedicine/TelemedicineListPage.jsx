// src/pages/telemedicine/TelemedicineListPage.jsx
import React, { useContext } from 'react';
import TelemedicineList from '../../components/telemedicine/TelemedicineList';
import Sidebar from '../../components/common/Sidebar';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const TelemedicineListPage = () => {
  const { user: currentUser } = useContext(AuthContext);

  // Determine if the current user can schedule a new session
  const canScheduleSession = currentUser && 
    (currentUser.role === 'PATIENT' || 
     currentUser.role === 'DOCTOR' || 
     currentUser.role === 'RECEPTIONIST' || 
     currentUser.role === 'ADMIN');

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Telemedicine Sessions</h1>
          {canScheduleSession && (
            <Link to="/telemedicine/sessions/new" className="btn btn-primary">
              Schedule New Session
            </Link>
          )}
        </div>
        <TelemedicineList /> {/* TelemedicineList will handle its own data fetching and role-based views */}
      </div>
    </div>
  );
};

export default TelemedicineListPage;
