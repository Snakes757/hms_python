// src/pages/telemedicine/TelemedicineSessionPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
// Corrected: Pointing to TelemedicineSessionDetails.jsx
// Assuming TelemedicineSessionDetails.jsx exports a component named TelemedicineSessionDetailsComponent or a default export.
import TelemedicineSessionDetailsComponent from "../../components/telemedicine/TelemedicineSessionDetails";
import Sidebar from "../../components/common/Sidebar";

const TelemedicineSessionPage = () => {
  const { sessionId } = useParams();

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        {/* Using the imported component */}
        <TelemedicineSessionDetailsComponent sessionIdParam={sessionId} />
      </div>
    </div>
  );
};

export default TelemedicineSessionPage;
