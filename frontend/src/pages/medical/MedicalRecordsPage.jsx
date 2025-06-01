// src/pages/medical/MedicalRecordsPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MedicalRecordsList from '../../components/medical/MedicalRecordsList'; // Assuming this exists
import MedicalRecordForm from '../../components/medical/MedicalRecordForm';   // Assuming this exists
import Sidebar from '../../components/common/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { listAllPatients } from '../../api/patients';
import usePermissions from '../../hooks/usePermissions';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MedicalRecordsPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();
  const location = useLocation();
  
  const preselectedPatientUserId = location.state?.patientUserId || new URLSearchParams(location.search).get('patientUserId');

  const [selectedPatientUserId, setSelectedPatientUserId] = useState(preselectedPatientUserId || '');
  const [patients, setPatients] = useState([]);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [editingMedicalRecord, setEditingMedicalRecord] = useState(null);
  const [error, setError] = useState('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (isRole.isPatient && currentUser) {
      setSelectedPatientUserId(currentUser.id.toString());
    } else if (can('VIEW_PATIENT_LIST')) {
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

  const handleEditMedicalRecord = (record) => {
    setEditingMedicalRecord(record);
    setShowMedicalRecordForm(true);
  };

  const handleFormSubmitOrCancel = () => {
    setShowMedicalRecordForm(false);
    setEditingMedicalRecord(null);
    // MedicalRecordsList should re-fetch or be given a refresh trigger
  };
  
  // Permissions for creating/editing medical records
  const canManageRecords = can('CREATE_MEDICAL_RECORD') || can('EDIT_MEDICAL_RECORD');

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Patient Medical Records</h1>
        {error && <div className="alert alert-danger">{error}</div>}

        {!isRole.isPatient && can('VIEW_PATIENT_LIST') && (
          <div className="mb-3 col-md-6">
            <label htmlFor="patientSelectForMedicalRecord" className="form-label">Select Patient:</label>
            {loadingPatients ? <LoadingSpinner size="sm" message="Loading patients..."/> : (
              <select 
                id="patientSelectForMedicalRecord" 
                className="form-select" 
                value={selectedPatientUserId}
                onChange={(e) => {
                  setSelectedPatientUserId(e.target.value);
                  setShowMedicalRecordForm(false); 
                  setEditingMedicalRecord(null);
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
              <h4>Medical Records for Patient ID: {selectedPatientUserId}</h4>
              {canManageRecords && !showMedicalRecordForm && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleEditMedicalRecord(null)}
                >
                  Add New Medical Record
                </button>
              )}
            </div>

            {showMedicalRecordForm ? (
              <MedicalRecordForm
                patientUserId={selectedPatientUserId}
                recordId={editingMedicalRecord ? editingMedicalRecord.id : null}
                onFormSubmit={handleFormSubmitOrCancel}
                onCancel={handleFormSubmitOrCancel}
              />
            ) : (
              // MedicalRecordsList was created previously, ensure it's correctly imported and used
              <MedicalRecordsList 
                patientUserId={selectedPatientUserId} 
                onEditRecord={canManageRecords ? handleEditMedicalRecord : undefined}
              />
            )}
          </>
        ) : (
          !isRole.isPatient && <p className="text-muted">Please select a patient to view or manage their medical records.</p>
        )}
        {isRole.isPatient && !selectedPatientUserId && <LoadingSpinner message="Loading your medical records..." />}
      </div>
    </div>
  );
};

export default MedicalRecordsPage;
