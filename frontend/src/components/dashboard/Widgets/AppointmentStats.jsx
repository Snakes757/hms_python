// src/components/dashboard/widgets/AppointmentStats.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listAppointments } from '../../../api/appointments'; // Assuming this can be filtered
import { AuthContext } from '../../../context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const AppointmentStatsWidget = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    upcoming: 0,
    completedToday: 0,
    pendingConfirmation: 0, // Example: 'SCHEDULED' status
    totalForUser: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchAppointmentStats = async () => {
      setIsLoading(true);
      setError('');
      try {
        let upcomingCount = 0;
        let completedTodayCount = 0;
        let pendingConfirmCount = 0;
        let totalUserAppointments = 0;

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        let params = {};
        // Tailor params based on role
        if (user.role === 'PATIENT') {
          params.patient__user__id = user.id;
        } else if (user.role === 'DOCTOR') {
          params.doctor__id = user.id;
        }
        // For Admin/Receptionist/Nurse, params could be empty to get all, or more specific if needed

        const appointmentsData = await listAppointments(params);
        const allAppointments = appointmentsData || []; // Ensure it's an array

        totalUserAppointments = allAppointments.length;

        allAppointments.forEach(appt => {
          const apptDate = new Date(appt.appointment_date_time);
          if (apptDate > today && (appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED')) {
            upcomingCount++;
          }
          if (appt.status === 'COMPLETED' && apptDate.toISOString().split('T')[0] === todayStr) {
            completedTodayCount++;
          }
          if (appt.status === 'SCHEDULED') {
            pendingConfirmCount++;
          }
        });

        setStats({
          upcoming: upcomingCount,
          completedToday: completedTodayCount,
          pendingConfirmation: pendingConfirmCount,
          totalForUser: totalUserAppointments
        });

      } catch (err) {
        setError('Could not load appointment statistics.');
        console.error("Error fetching appointment stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointmentStats();
  }, [user]);

  if (isLoading) {
    return <div className="text-center p-3"><LoadingSpinner message="Loading stats..." /></div>;
  }

  if (error) {
    return <p className="text-danger small p-3">{error}</p>;
  }

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h5 className="card-title">My Appointments Overview</h5>
        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center">
            Upcoming Appointments
            <span className="badge bg-primary rounded-pill">{stats.upcoming}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center">
            Pending Confirmation
            <span className="badge bg-warning text-dark rounded-pill">{stats.pendingConfirmation}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center">
            Completed Today
            <span className="badge bg-success rounded-pill">{stats.completedToday}</span>
          </li>
           <li className="list-group-item d-flex justify-content-between align-items-center">
            Total My Appointments (Filtered)
            <span className="badge bg-secondary rounded-pill">{stats.totalForUser}</span>
          </li>
        </ul>
        <Link to="/appointments" className="btn btn-outline-primary btn-sm mt-3">
          View All My Appointments
        </Link>
      </div>
    </div>
  );
};

export default AppointmentStatsWidget;
