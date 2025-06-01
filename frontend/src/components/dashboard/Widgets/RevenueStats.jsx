// src/components/dashboard/widgets/RevenueStats.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getFinancialReport } from '../../../api/reports'; // For Admin/Receptionist
import { AuthContext } from '../../../context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const RevenueStatsWidget = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    revenueThisMonth: '0.00', // Example: from financial report
    outstandingTotal: '0.00', // Example: from financial report
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'RECEPTIONIST')) {
      return; // Only fetch for relevant roles
    }

    const fetchRevenueStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        // For "Revenue This Month", we might need to filter the financial report
        // by the current month or have a specific API endpoint.
        // For simplicity, we'll use the overall totals from the default financial report period (e.g., last 30 days).
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

        const reportData = await getFinancialReport({ date_from: firstDayOfMonth, date_to: lastDayOfMonth });
        
        setStats({
          revenueThisMonth: reportData.total_revenue_in_period || '0.00',
          outstandingTotal: reportData.total_outstanding_revenue_all_time || '0.00',
        });
      } catch (err) {
        setError('Could not load revenue statistics.');
        console.error("Error fetching revenue stats for widget:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenueStats();
  }, [user]);

  if (isLoading) {
    return <div className="text-center p-3"><LoadingSpinner message="Loading stats..." /></div>;
  }

  if (error) {
    return <p className="text-danger small p-3">{error}</p>;
  }
  
  // Only show this widget to Admin or Receptionist
  if (!user || (user.role !== 'ADMIN' && user.role !== 'RECEPTIONIST')) {
    return null;
  }

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h5 className="card-title">Financial Overview</h5>
        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center">
            Revenue (This Month)
            <span className="badge bg-success rounded-pill">${stats.revenueThisMonth}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center">
            Total Outstanding
            <span className="badge bg-danger rounded-pill">${stats.outstandingTotal}</span>
          </li>
        </ul>
        {user.role === 'ADMIN' && (
            <Link to="/admin/reports/financial-report" className="btn btn-outline-primary btn-sm mt-3">
            View Detailed Financial Report
            </Link>
        )}
         {user.role === 'RECEPTIONIST' && (
            <Link to="/billing/invoices" className="btn btn-outline-primary btn-sm mt-3">
            Manage Invoices
            </Link>
        )}
      </div>
    </div>
  );
};

export default RevenueStatsWidget;
