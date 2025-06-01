// src/components/reports/StaffActivityReport.jsx
import React, { useState, useEffect } from 'react';
import { getStaffActivityReport } from '../../api/reports';
import LoadingSpinner from '../common/LoadingSpinner';

const StaffActivityReport = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getStaffActivityReport();
        setReportData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch staff activity report.');
        setReportData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading staff activity report..." />;
  }

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  if (!reportData) {
    return <div className="alert alert-info">No staff activity data available.</div>;
  }
  
  const { staff_counts_by_role, report_generated_at, message } = reportData;

  return (
    <div className="container mt-4">
      <h3>Staff Activity Report</h3>
      <p className="text-muted">Report generated at: {new Date(report_generated_at).toLocaleString()}</p>
      {message && <p className="alert alert-info small">{message}</p>}
      <hr />

      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">Staff Counts by Role</h5>
        </div>
        <div className="card-body">
          {staff_counts_by_role && staff_counts_by_role.length > 0 ? (
            <ul className="list-group list-group-flush">
              {staff_counts_by_role.map(item => (
                <li key={item.role} className="list-group-item d-flex justify-content-between align-items-center">
                  {item.role}
                  <span className="badge bg-primary rounded-pill">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No staff count data available.</p>
          )}
        </div>
      </div>
      
      {/* Future enhancements: Could include more detailed activity metrics if backend provides them,
          such as number of appointments handled, records created, etc., per staff member or role.
          This would require more complex data from the backend.
      */}
    </div>
  );
};

export default StaffActivityReport;
