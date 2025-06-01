// src/components/medical/TreatmentList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listTreatmentsForPatient, deleteTreatment } from '../../api/treatments';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
// import TreatmentForm from './TreatmentForm'; // For embedding add/edit form

const TreatmentList = ({ patientUserId, onEditTreatment }) => {
  const [treatments, setTreatments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchTreatments = async () => {
    if (!patientUserId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await listTreatmentsForPatient(patientUserId);
      setTreatments(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch treatments.');
      setTreatments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, [patientUserId]);

  const handleDelete = async (treatmentId) => {
    if (window.confirm('Are you sure you want to delete this treatment record?')) {
      setIsLoading(true);
      try {
        await deleteTreatment(patientUserId, treatmentId);
        fetchTreatments(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to delete treatment.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canManage = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN');

  if (isLoading && treatments.length === 0) {
    return <LoadingSpinner message="Loading treatments..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  return (
    <div className="mt-0"> {/* Adjusted margin for embedding */}
      {/* {canManage && <button className="btn btn-sm btn-success mb-2" onClick={() => onEditTreatment(null)}>Add Treatment</button>} */}
      
      {treatments.length === 0 && !isLoading && (
        <p className="text-muted">No treatments found for this patient.</p>
      )}

      {treatments.length > 0 && (
        <div className="list-group">
          {treatments.map((tx) => (
            <div key={tx.id} className="list-group-item list-group-item-action flex-column align-items-start mb-2 shadow-sm border-start-warning">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{tx.treatment_name}</h5>
                <small className="text-muted">{new Date(tx.treatment_date_time).toLocaleString()}</small>
              </div>
              <p className="mb-1"><strong>Description:</strong> {tx.description || 'N/A'}</p>
              <p className="mb-1"><strong>Outcome:</strong> {tx.outcome || 'N/A'}</p>
              {tx.notes && <p className="mb-1"><strong>Notes:</strong> {tx.notes}</p>}
              <small className="text-muted">
                Administered by: {tx.administered_by_details?.first_name || ''} {tx.administered_by_details?.last_name || 'N/A'} ({tx.administered_by_details?.role_display || 'Unknown Role'})
              </small>
              {tx.appointment_details && <small className="d-block text-muted">Linked Appointment ID: {tx.appointment_details.id}</small>}
              {tx.medical_record_details && <small className="d-block text-muted">Linked Medical Record ID: {tx.medical_record_details.id}</small>}
              
              {canManage && (
                <div className="mt-2 text-end">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => onEditTreatment(tx)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(tx.id)} disabled={isLoading}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentList;
