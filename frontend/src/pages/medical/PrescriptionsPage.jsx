// src/pages/medical/PrescriptionsPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PrescriptionList from '../../components/medical/PrescriptionList';
import PrescriptionForm from '../../components/medical/PrescriptionForm';
import Sidebar from '../../components/common/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { listAllPatients } from '../../api/patients'; // To allow staff to select a patient
import usePermissions from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PrescriptionsPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();
  const location = useLocation();
  
  // Attempt to get patientUserId from location state or query params
  const preselectedPatientUserId = location.state?.patientUserId || new URLSearchParams(location.search).get('patientUserId');

  const [selectedPatientUserId, setSelectedPatientUserId] = useState(preselectedPatientUserId || '');
  const [patients, setPatients] = useState([]); // For staff to select a patient
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null); // null for new, or prescription object for edit
  const [error, setError] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (isRole.isPatient && currentUser) {
      setSelectedPatientUserId(currentUser.id.toString());
    } else if (can('VIEW_PATIENT_LIST')) { // Check if staff can view patient list
      setLoadingPatients(true);
      listAllPatients()
        .then(data => {
          setPatients(data || []);
          if (preselectedPatientUserId && (data || []).find(p => p.user.id.toString() === preselectedPatientUserId)) {
            setSelectedPatientUserId(preselectedPatientUserId);
          }
        })
        .catch(err => {
          console.error("Failed to fetch patients for selection:", err);
          setError("Could not load patient list for selection.");
        })
        .finally(() => setLoadingPatients(false));
    }
  }, [currentUser, isRole.isPatient, can, preselectedPatientUserId]);

  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setShowPrescriptionForm(true);
  };

  const handleFormSubmitOrCancel = () => {
    setShowPrescriptionForm(false);
    setEditingPrescription(null);
    // The PrescriptionList component should re-fetch its data internally after a submission.
    // Or pass a refresh key/callback if needed.
  };
  
  const canManage = can('CREATE_PRESCRIPTION') || can('EDIT_PRESCRIPTION'); // Simplified check

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Patient Prescriptions</h1>
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Patient Selector for Staff */}
        { !isRole.isPatient && can('VIEW_PATIENT_LIST') && (
          <div className="mb-3 col-md-6">
            <label htmlFor="patientSelectForPrescription" className="form-label">Select Patient:</label>
            {loadingPatients ? <LoadingSpinner size="sm" message="Loading patients..."/> : (
              <select 
                id="patientSelectForPrescription" 
                className="form-select" 
                value={selectedPatientUserId}
                onChange={(e) => {
                  setSelectedPatientUserId(e.target.value);
                  setShowPrescriptionForm(false); 
                  setEditingPrescription(null);
                }}
              >
                <option value="">-- Select a Patient --</option>
                {patients.map(p => (
                  <option key={p.user.id} value={p.user.id}>
                    {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        
        {selectedPatientUserId ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Prescriptions for Patient ID: {selectedPatientUserId}</h4>
              {canManage && !showPrescriptionForm && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleEditPrescription(null)} // null indicates new prescription
                >
                  Add New Prescription
                </button>
              )}
            </div>

            {showPrescriptionForm ? (
              <PrescriptionForm
                patientUserId={selectedPatientUserId}
                prescriptionId={editingPrescription ? editingPrescription.id : null}
                onFormSubmit={handleFormSubmitOrCancel}
                onCancel={handleFormSubmitOrCancel}
              />
            ) : (
              <PrescriptionList 
                patientUserId={selectedPatientUserId} 
                onEditPrescription={canManage ? handleEditPrescription : undefined} 
              />
            )}
          </>
        ) : (
          !isRole.isPatient && <p className="text-muted">Please select a patient to view or manage their prescriptions.</p>
        )}
        {isRole.isPatient && !selectedPatientUserId && <LoadingSpinner message="Loading your prescriptions..." />}
      </div>
    </div>
  );
};

export default PrescriptionsPage;
