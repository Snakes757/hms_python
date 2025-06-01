// src/components/medical/PrescriptionList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listPrescriptionsForPatient, deletePrescription } from '../../api/prescriptions';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
// import PrescriptionForm from './PrescriptionForm'; // To embed form for adding/editing

const PrescriptionList = ({ patientUserId, onEditPrescription }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchPrescriptions = async () => {
    if (!patientUserId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await listPrescriptionsForPatient(patientUserId);
      setPrescriptions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch prescriptions.');
      setPrescriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientUserId]);

  const handleDelete = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      setIsLoading(true); // Consider a specific loading state for delete
      try {
        await deletePrescription(patientUserId, prescriptionId);
        fetchPrescriptions(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to delete prescription.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canManage = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'ADMIN');

  if (isLoading && prescriptions.length === 0) {
    return <LoadingSpinner message="Loading prescriptions..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }
  
  return (
    <div className="mt-0"> {/* Adjusted margin for embedding */}
      {/* Button to trigger add form can be here or in parent component */}
      {/* {canManage && <button className="btn btn-sm btn-success mb-2" onClick={() => onEditPrescription(null)}>Add Prescription</button>} */}

      {prescriptions.length === 0 && !isLoading && (
        <p className="text-muted">No prescriptions found for this patient.</p>
      )}

      {prescriptions.length > 0 && (
        <div className="list-group">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="list-group-item list-group-item-action flex-column align-items-start mb-2 shadow-sm border-start-info">
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{rx.medication_name} <span className={`badge bg-${rx.is_active ? 'success' : 'secondary'}`}>{rx.is_active ? 'Active' : 'Inactive'}</span></h5>
                <small className="text-muted">Prescribed: {new Date(rx.prescription_date).toLocaleDateString()}</small>
              </div>
              <p className="mb-1"><strong>Dosage:</strong> {rx.dosage}</p>
              <p className="mb-1"><strong>Frequency:</strong> {rx.frequency}</p>
              {rx.duration_days && <p className="mb-1"><strong>Duration:</strong> {rx.duration_days} days</p>}
              <p className="mb-1"><strong>Instructions:</strong> {rx.instructions || 'N/A'}</p>
              <small className="text-muted">
                Prescribed by: Dr. {rx.prescribed_by_details?.first_name || ''} {rx.prescribed_by_details?.last_name || 'N/A'}
              </small>
              {rx.appointment_details && <small className="d-block text-muted">Linked Appointment ID: {rx.appointment_details.id}</small>}
              {rx.medical_record_details && <small className="d-block text-muted">Linked Medical Record ID: {rx.medical_record_details.id}</small>}
              
              {canManage && (
                <div className="mt-2 text-end">
                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => onEditPrescription(rx)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rx.id)} disabled={isLoading}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionList;
