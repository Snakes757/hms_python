// src/components/dashboard/widgets/PatientStats.jsx
import React, { useState, useEffect } from 'react';
// import { getOverallPatientStats } from '../../../api/patients'; // Placeholder API call
import LoadingSpinner from '../../common/LoadingSpinner';

const PatientStatsWidget = ({ userRole }) => { // userRole might influence what stats are shown
  const [stats, setStats] = useState({
    totalPatients: 0,
    newThisMonth: 0,
    // Add more relevant stats
  });
  const [isLoading, setIsLoading] = useState(false); // Set to true when API call is implemented
  const [error, setError] = useState('');

  useEffect(() => {
    // Placeholder: API call to fetch patient stats
    // const fetchStats = async () => {
    //   setIsLoading(true);
    //   try {
    //     const data = await getOverallPatientStats(); // Example API
    //     setStats(data);
    //   } catch (err) {
    //     setError('Could not load patient statistics.');
    //     console.error(err);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchStats();
    // For now, using placeholder data
    setIsLoading(false); // Remove this when API call is implemented
  }, [userRole]);

  if (isLoading) {
    return <LoadingSpinner message="Loading patient stats..." />;
  }

  if (error) {
    return <p className="text-danger small">{error}</p>;
  }

  // Only show this widget to relevant roles
  if (userRole !== 'ADMIN' && userRole !== 'RECEPTIONIST' && userRole !== 'DOCTOR' && userRole !== 'NURSE') {
    return null;
  }

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h5 className="card-title">Patient Statistics</h5>
        <ul className="list-unstyled">
          <li><strong>Total Patients:</strong> <span className="badge bg-info">{stats.totalPatients}</span></li>
          <li><strong>New This Month:</strong> <span className="badge bg-success">{stats.newThisMonth}</span></li>
        </ul>
        {/* <Link to="/admin/reports/patient-statistics" className="btn btn-outline-primary btn-sm mt-2">
          Detailed Patient Report
        </Link> */}
      </div>
    </div>
  );
};

export default PatientStatsWidget;
