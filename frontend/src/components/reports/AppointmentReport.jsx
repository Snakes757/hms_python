// src/components/reports/AppointmentReport.jsx
import React, { useState, useEffect } from 'react';
import { getAppointmentReport } from '../../api/reports';
import LoadingSpinner from '../common/LoadingSpinner';

const AppointmentReport = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
  });

  const fetchReport = async (currentFilters) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAppointmentReport(currentFilters);
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch appointment report.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch with default (last 30 days as per backend) or current filters
    fetchReport(filters); 
  }, []); // Initial fetch

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyFilters = () => {
    fetchReport(filters);
  };
  
  const handleDownloadCSV = async () => {
    setIsLoading(true);
    setError('');
    try {
        const csvParams = { ...filters, format: 'csv' };
        const csvData = await getAppointmentReport(csvParams);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'appointment_report.csv');
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


  if (isLoading && !reportData) { // Show full loading only if no data is present yet
    return <LoadingSpinner message="Loading appointment report..." />;
  }

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Appointment Report</h3>
        <button className="btn btn-outline-success btn-sm" onClick={handleDownloadCSV} disabled={isLoading || !reportData}>
            Download CSV
        </button>
      </div>
      
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Filters</h5>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label htmlFor="date_from" className="form-label">Date From</label>
              <input type="date" className="form-control" id="date_from" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="date_to" className="form-label">Date To</label>
              <input type="date" className="form-control" id="date_to" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
            </div>
            <div className="col-md-auto">
              <button className="btn btn-primary" onClick={handleApplyFilters} disabled={isLoading}>Apply Filters</button>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <LoadingSpinner message="Fetching report data..." />}

      {!isLoading && !reportData && <div className="alert alert-info">No appointment report data available for the selected criteria.</div>}

      {reportData && (
        <>
          <p className="text-muted">Report generated at: {new Date(reportData.report_generated_at).toLocaleString()}</p>
          {reportData.filters_applied?.period && <p className="text-muted">Filters Applied: {reportData.filters_applied.period}</p>}
          <hr />

          <div className="row g-3">
            <div className="col-md-4">
              <div className="card shadow-sm text-center">
                <div className="card-body">
                  <h5 className="card-title">Total Appointments</h5>
                  <p className="card-text fs-2 fw-bold">{reportData.total_appointments_in_period}</p>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Appointments by Status</h5>
                  {reportData.appointments_by_status && reportData.appointments_by_status.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {reportData.appointments_by_status.map(item => (
                        <li key={item.status} className="list-group-item d-flex justify-content-between align-items-center">
                          {item.status}
                          <span className="badge bg-primary rounded-pill">{item.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p>No status data.</p>}
                </div>
              </div>
            </div>

            <div className="col-md-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Appointments by Type</h5>
                  {reportData.appointments_by_type && reportData.appointments_by_type.length > 0 ? (
                     <div className="row">
                        {reportData.appointments_by_type.map(item => (
                            <div key={item.type} className="col-md-4 col-6 mb-2 text-center">
                                <strong>{item.type}</strong>: {item.count}
                            </div>
                        ))}
                    </div>
                  ) : <p>No type data.</p>}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Appointments by Date (Selected Period)</h5>
                  {reportData.appointments_by_date_in_period && reportData.appointments_by_date_in_period.length > 0 ? (
                    <div className="table-responsive" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        <table className="table table-sm table-hover">
                            <thead><tr><th>Date</th><th className="text-end">Count</th></tr></thead>
                            <tbody>
                            {reportData.appointments_by_date_in_period.map(item => (
                                <tr key={item.date}><td>{new Date(item.date).toLocaleDateString()}</td><td className="text-end">{item.count}</td></tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                  ) : <p>No daily appointment data for this period.</p>}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Appointments Per Doctor</h5>
                  {reportData.appointments_per_doctor && reportData.appointments_per_doctor.length > 0 ? (
                    <div className="table-responsive" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        <table className="table table-sm table-hover">
                            <thead><tr><th>Doctor</th><th className="text-end">Count</th></tr></thead>
                            <tbody>
                            {reportData.appointments_per_doctor.map(item => (
                                <tr key={item.doctor__email}><td>Dr. {item.doctor__first_name} {item.doctor__last_name} ({item.doctor__email})</td><td className="text-end">{item.count}</td></tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                  ) : <p>No data on appointments per doctor.</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentReport;
