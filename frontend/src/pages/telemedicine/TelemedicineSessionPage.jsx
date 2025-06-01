// src/pages/telemedicine/TelemedicineSessionPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import TelemedicineSessionDetails from '../../components/telemedicine/TelemedicineSessionDetails'; // New component
import Sidebar from '../../components/common/Sidebar';

const TelemedicineSessionPage = () => {
  const { sessionId } = useParams(); // Get sessionId from URL

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <TelemedicineSessionDetails sessionIdParam={sessionId} />
      </div>
    </div>
  );
};

export default TelemedicineSessionPage;
