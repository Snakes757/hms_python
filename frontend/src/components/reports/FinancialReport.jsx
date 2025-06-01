// src/components/reports/FinancialReport.jsx
import React, { useState, useEffect } from 'react';
import { getFinancialReport } from '../../api/reports';
import LoadingSpinner from '../common/LoadingSpinner';

const FinancialReport = () => {
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
      const data = await getFinancialReport(currentFilters);
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch financial report.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(filters); // Initial fetch
  }, []);

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
        const csvData = await getFinancialReport(csvParams);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'financial_report.csv');
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

  if (isLoading && !reportData) {
    return <LoadingSpinner message="Loading financial report..." />;
  }

  if (error) {
    return <div className="alert alert-danger" role="alert">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Financial Report</h3>
         <button className="btn btn-outline-success btn-sm" onClick={handleDownloadCSV} disabled={isLoading || !reportData}>
            Download CSV
        </button>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Filters</h5>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label htmlFor="fin_date_from" className="form-label">Date From</label>
              <input type="date" className="form-control" id="fin_date_from" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="fin_date_to" className="form-label">Date To</label>
              <input type="date" className="form-control" id="fin_date_to" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
            </div>
            <div className="col-md-auto">
              <button className="btn btn-primary" onClick={handleApplyFilters} disabled={isLoading}>Apply Filters</button>
            </div>
          </div>
        </div>
      </div>
      
      {isLoading && <LoadingSpinner message="Fetching report data..." />}
      {!isLoading && !reportData && <div className="alert alert-info">No financial report data available for the selected criteria.</div>}

      {reportData && (
        <>
          <p className="text-muted">Report generated at: {new Date(reportData.report_generated_at).toLocaleString()}</p>
          {reportData.filters_applied?.period && <p className="text-muted">Filters Applied: {reportData.filters_applied.period}</p>}
          <hr />

          <div className="row g-3">
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm text-center h-100">
                <div className="card-body">
                  <h5 className="card-title">Total Revenue (Selected Period)</h5>
                  <p className="card-text fs-2 fw-bold">${reportData.total_revenue_in_period}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm text-center h-100">
                <div className="card-body">
                  <h5 className="card-title">Total Outstanding Revenue (All Time)</h5>
                  <p className="card-text fs-2 fw-bold">${reportData.total_outstanding_revenue_all_time}</p>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Invoices by Status (Selected Period)</h5>
                  {reportData.invoices_by_status_in_period && reportData.invoices_by_status_in_period.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {reportData.invoices_by_status_in_period.map(item => (
                        <li key={item.status} className="list-group-item d-flex justify-content-between align-items-center">
                          {item.status}
                          <span>Count: {item.count} | Value: ${item.total_value}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p>No invoice status data.</p>}
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Payments by Method (Selected Period)</h5>
                  {reportData.payments_by_method_in_period && reportData.payments_by_method_in_period.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {reportData.payments_by_method_in_period.map(item => (
                        <li key={item.method} className="list-group-item d-flex justify-content-between align-items-center">
                          {item.method}
                          <span>Count: {item.count} | Paid: ${item.total_paid}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p>No payment method data.</p>}
                </div>
              </div>
            </div>
            {/* Detailed Invoice and Payment lists for the period could be added here if needed, similar to CSV structure */}
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialReport;
