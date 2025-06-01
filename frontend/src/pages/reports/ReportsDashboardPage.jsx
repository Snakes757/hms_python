// src/pages/reports/ReportsDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { listAvailableReports } from '../../api/reports';
import Sidebar from '../../components/common/Sidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

const ReportsDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReportsList = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await listAvailableReports();
        setReports(data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch list of available reports.');
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReportsList();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 flex-grow-1">
          <LoadingSpinner message="Loading available reports..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 flex-grow-1">
          <div className="alert alert-danger" role="alert">{error}</div>
        </div>
      </div>
    );
  }
  
  const reportLinks = {
    'admin_dashboard:report_patient_statistics': '/admin/reports/patient-statistics',
    'admin_dashboard:report_appointment': '/admin/reports/appointment-report', // Need to create this page
    'admin_dashboard:report_financial': '/admin/reports/financial-report', // Need to create this page
    'admin_dashboard:report_staff_activity': '/admin/reports/staff-activity', // Need to create this page
  };


  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Available Reports</h1>
        <p>Select a report to view detailed statistics and information.</p>
        {reports.length > 0 ? (
          <div className="list-group">
            {reports.map((report, index) => (
              <Link 
                key={index} 
                to={reportLinks[report.endpoint] || '#'} 
                className={`list-group-item list-group-item-action ${!reportLinks[report.endpoint] ? 'disabled' : ''}`}
              >
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">{report.name}</h5>
                </div>
                <p className="mb-1">{report.description}</p>
                {/* <small>Endpoint: {report.endpoint}</small> */}
                 {!reportLinks[report.endpoint] && <small className="text-danger d-block">Frontend link not configured for this report.</small>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">No reports are currently available or configured.</div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboardPage;
