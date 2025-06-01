// src/components/common/Sidebar.jsx
import React, { useContext }  from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  // If no user, or if we decide some pages don't show sidebar, return null
  // This logic will be refined later based on routes and overall layout strategy
  if (!user) {
    return null; 
  }

  return (
    <nav id="sidebar" className="bg-light border-end p-3" style={{ minWidth: '220px', height: 'calc(100vh - 56px)', position: 'sticky', top: '56px' }}> {/* 56px is typical navbar height */}
      <div className="sidebar-header mb-3">
        <h4>Navigation</h4>
      </div>
      <ul className="list-unstyled components">
        <li>
          <Link to="/" className="nav-link">Dashboard</Link>
        </li>
        
        {/* Patient Links */}
        {(user.role === 'PATIENT' || user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li><strong className="text-muted small">Patient Menu</strong></li>
            {user.role === 'PATIENT' && <li><Link to="/my-records" className="nav-link">My Medical Records</Link></li>}
            {user.role === 'PATIENT' && <li><Link to="/my-appointments" className="nav-link">My Appointments</Link></li>}
            {(user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
                 <li><Link to="/patients" className="nav-link">Patient List</Link></li>
            )}
            {/* Add more patient-related links here */}
          </>
        )}

        {/* Staff Links */}
        {(user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'RECEPTIONIST' || user.role === 'ADMIN') && (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li><strong className="text-muted small">Staff Menu</strong></li>
            <li><Link to="/appointments" className="nav-link">Appointments</Link></li>
            {/* Add more staff-related links here */}
          </>
        )}
        
        {/* Doctor Specific Links */}
        {user.role === 'DOCTOR' && (
          <>
            <li><Link to="/doctor/schedule" className="nav-link">My Schedule</Link></li>
            {/* Add more doctor-specific links */}
          </>
        )}

        {/* Admin Specific Links */}
        {user.role === 'ADMIN' && (
          <>
            <li><hr className="dropdown-divider" /></li>
            <li><strong className="text-muted small">Admin Menu</strong></li>
            <li><Link to="/admin/users" className="nav-link">User Management</Link></li>
            <li><Link to="/admin/reports" className="nav-link">Reports</Link></li>
            {/* Add more admin-specific links */}
          </>
        )}
        
        <li><hr className="dropdown-divider" /></li>
        <li>
          <Link to="/profile/me" className="nav-link">My Profile</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
