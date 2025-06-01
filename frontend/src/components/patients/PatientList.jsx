// src/components/patients/PatientList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listAllPatients } from '../../api/patients';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom'; // For linking to patient details

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext); // To check role for conditional rendering/actions

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Ensure only authorized roles can fetch this list
        // The API endpoint itself should be protected, but client-side check is good UX.
        if (user && (user.role === 'DOCTOR' || user.role === 'NURSE' || user.role === 'ADMIN' || user.role === 'RECEPTIONIST')) {
          const data = await listAllPatients();
          setPatients(data || []); // data might be an array or {count, next, previous, results}
        } else {
          setError("You are not authorized to view this list.");
          setPatients([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch patients.');
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) { // Only fetch if user is loaded from context
        fetchPatients();
    }
  }, [user]); // Re-fetch if user context changes (e.g., on login/logout)

  if (isLoading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading patients...</span>
        </div>
        <p>Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!user || !['DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'].includes(user.role)) {
    return <div className="alert alert-warning mt-3">Access to patient list is restricted.</div>;
  }
  
  if (patients.length === 0) {
    return <div className="alert alert-info mt-3">No patients found.</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="mb-3">Patient List</h3>
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>ID (User)</th>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              // The patient object from /api/v1/patients/ is a Patient model instance.
              // It has a 'user' field which is a PK to CustomUser.
              // The PatientSerializer in backend nests 'user' details.
              // So patient.user.id, patient.user.first_name etc. should be available.
              <tr key={patient.user.id}>
                <td>{patient.user.id}</td>
                <td>{patient.user.first_name} {patient.user.last_name}</td>
                <td>{patient.user.email}</td>
                <td>{patient.gender_display || patient.gender || 'N/A'}</td>
                <td>{patient.date_of_birth || 'N/A'}</td>
                <td>{patient.phone_number || 'N/A'}</td>
                <td>
                  <Link to={`/patients/${patient.user.id}`} className="btn btn-sm btn-outline-primary me-2">
                    View
                  </Link>
                  {/* Add Edit/Delete buttons based on role permissions later */}
                  {/* Example: user.role === 'ADMIN' && <button>Edit</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
