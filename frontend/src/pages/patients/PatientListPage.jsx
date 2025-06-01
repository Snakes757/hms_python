// src/pages/patients/PatientListPage.jsx
import React from 'react';
import PatientList from '../../components/patients/PatientList';
import Sidebar from '../../components/common/Sidebar'; // Assuming sidebar is used here

const PatientListPage = () => {
  return (
    <div className="d-flex">
      <Sidebar /> {/* Include Sidebar */}
      <div className="container-fluid mt-4 flex-grow-1"> {/* Ensure content area takes remaining space */}
        <h1>Patient Management</h1>
        <PatientList />
      </div>
    </div>
  );
};

export default PatientListPage;
