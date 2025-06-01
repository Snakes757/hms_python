// src/components/reports/PatientStatistics.jsx
import React, { useState, useEffect } from 'react';
import { getPatientStatisticsReport } from '../../api/reports';
import LoadingSpinner from '../common/LoadingSpinner';

const PatientStatistics = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getPatientStatisticsReport();
        setReportData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch patient statistics.');
        setReportData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleDownloadCSV = async () => {
    setIsLoading(true); // Indicate activity
    try {
        const csvData = await getPatientStatisticsReport('csv');
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'patient_statistics_report.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (err) {
        setError(err.message || 'Failed to download CSV report.');
    } finally {
        setIsLoading(false);
    }
  };


  if (isLoading) {
    return <LoadingSpinner message="Loading patient statistics report..." />;
  }

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  if (!reportData) {
    return <div className="alert alert-info">No patient statistics data available.</div>;
  }

  const {
    total_patients,
    patients_by_gender,
    recent_registrations_last_30_days,
    registrations_by_month_current_year,
    patient_age_distribution,
    report_generated_at
  } = reportData;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Patient Statistics Report</h3>
        <button className="btn btn-outline-success btn-sm" onClick={handleDownloadCSV} disabled={isLoading}>
            Download CSV
        </button>
      </div>
      <p className="text-muted">Report generated at: {new Date(report_generated_at).toLocaleString()}</p>
      <hr />

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-body text-center">
              <h5 className="card-title">Total Patients</h5>
              <p className="card-text fs-2 fw-bold">{total_patients}</p>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Patients by Gender</h5>
              {patients_by_gender && patients_by_gender.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {patients_by_gender.map(item => (
                    <li key={item.gender} className="list-group-item d-flex justify-content-between align-items-center">
                      {item.gender || 'Unknown'}
                      <span className="badge bg-primary rounded-pill">{item.count}</span>
                    </li>
                  ))}
                </ul>
              ) : <p>No gender data available.</p>}
            </div>
          </div>
        </div>

        <div className="col-md-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Patient Age Distribution</h5>
              {patient_age_distribution ? (
                <div className="row">
                  {Object.entries(patient_age_distribution).map(([group, count]) => (
                    <div key={group} className="col-md-3 col-6 mb-2 text-center">
                      <strong>{group.replace('_', ' ').replace('under ', '<').replace('over ', '>')}</strong>: {count}
                    </div>
                  ))}
                </div>
              ) : <p>No age distribution data.</p>}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Recent Registrations (Last 30 Days)</h5>
              {/* This data might be better visualized as a simple bar chart or table */}
              {recent_registrations_last_30_days && recent_registrations_last_30_days.length > 0 ? (
                <div className="table-responsive" style={{maxHeight: '300px', overflowY: 'auto'}}>
                    <table className="table table-sm table-hover">
                        <thead><tr><th>Date</th><th className="text-end">Count</th></tr></thead>
                        <tbody>
                        {recent_registrations_last_30_days.map(item => (
                            <tr key={item.date}><td>{new Date(item.date).toLocaleDateString()}</td><td className="text-end">{item.count}</td></tr>
                        ))}
                        </tbody>
                    </table>
                </div>
              ) : <p>No recent registrations in the last 30 days.</p>}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Registrations by Month (Current Year)</h5>
               {registrations_by_month_current_year && registrations_by_month_current_year.length > 0 ? (
                 <div className="table-responsive" style={{maxHeight: '300px', overflowY: 'auto'}}>
                    <table className="table table-sm table-hover">
                        <thead><tr><th>Month</th><th className="text-end">Count</th></tr></thead>
                        <tbody>
                        {registrations_by_month_current_year.map(item => (
                            <tr key={item.month}><td>{new Date(item.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</td><td className="text-end">{item.count}</td></tr>
                        ))}
                        </tbody>
                    </table>
                </div>
              ) : <p>No registration data for the current year by month.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientStatistics;
