// src/components/medical/ObservationList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listObservationsForPatient, deleteObservation } from '../../api/observations';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ObservationList = ({ patientUserId, onEditObservation }) => {
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchObservations = async () => {
    if (!patientUserId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await listObservationsForPatient(patientUserId);
      setObservations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch observations.');
      setObservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, [patientUserId]);

  const handleDelete = async (observationId) => {
    if (window.confirm('Are you sure you want to delete this observation record?')) {
      setIsLoading(true);
      try {
        await deleteObservation(patientUserId, observationId);
        fetchObservations(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to delete observation.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canManage = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN');

  if (isLoading && observations.length === 0) {
    return <LoadingSpinner message="Loading observations..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  return (
    <div className="mt-0"> {/* Adjusted for embedding */}
      {/* {canManage && <button className="btn btn-sm btn-success mb-2" onClick={() => onEditObservation(null)}>Add Observation</button>} */}

      {observations.length === 0 && !isLoading && (
        <p className="text-muted">No observations found for this patient.</p>
      )}

      {observations.length > 0 && (
        <div className="list-group">
          {observations.map((obs) => (
            <div key={obs.id} className="list-group-item list-group-item-action flex-column align-items-start mb-2 shadow-sm border-start-info">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">Observation on {new Date(obs.observation_date_time).toLocaleString()}</h5>
                {/* <small>ID: {obs.id}</small> */}
              </div>
              {obs.symptoms_observed && <p className="mb-1"><strong>Symptoms:</strong> {obs.symptoms_observed}</p>}
              {obs.vital_signs && (
                <p className="mb-1">
                  <strong>Vital Signs:</strong> 
                  <pre className="bg-light p-2 rounded-1 small mt-1" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                    {typeof obs.vital_signs === 'string' ? obs.vital_signs : JSON.stringify(obs.vital_signs, null, 2)}
                  </pre>
                </p>
              )}
              {obs.description && <p className="mb-1"><strong>Description:</strong> {obs.description}</p>}
              {obs.notes && <p className="mb-1"><strong>Notes:</strong> {obs.notes}</p>}
              <small className="text-muted">
                Observed by: {obs.observed_by_details?.first_name || ''} {obs.observed_by_details?.last_name || 'N/A'} ({obs.observed_by_details?.role_display || 'Unknown Role'})
              </small>
              {obs.appointment_details && <small className="d-block text-muted">Linked Appointment ID: {obs.appointment_details.id}</small>}
              {obs.medical_record_details && <small className="d-block text-muted">Linked Medical Record ID: {obs.medical_record_details.id}</small>}
              
              {canManage && (
                <div className="mt-2 text-end">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => onEditObservation(obs)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(obs.id)} disabled={isLoading}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ObservationList;
