// src/pages/medical/ObservationsPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ObservationList from '../../components/medical/ObservationList';
import ObservationForm from '../../components/medical/ObservationForm';
import Sidebar from '../../components/common/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { listAllPatients } from '../../api/patients';

const ObservationsPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const location = useLocation();
  const preselectedPatientUserId = location.state?.patientUserId || new URLSearchParams(location.search).get('patientUserId');

  const [selectedPatientUserId, setSelectedPatientUserId] = useState(preselectedPatientUserId || '');
  const [patients, setPatients] = useState([]);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [editingObservation, setEditingObservation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatientsForSelection = async () => {
      if (currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN')) {
        try {
          const patientsData = await listAllPatients();
          setPatients(patientsData || []);
          if (preselectedPatientUserId && patientsData.find(p => p.user.id.toString() === preselectedPatientUserId)) {
            setSelectedPatientUserId(preselectedPatientUserId);
          }
        } catch (err) {
          console.error("Failed to fetch patients for selection:", err);
          setError("Could not load patient list for selection.");
        }
      }
    };
    fetchPatientsForSelection();
  }, [currentUser, preselectedPatientUserId]);

  const handleEditObservation = (observation) => {
    setEditingObservation(observation);
    setShowObservationForm(true);
  };

  const handleObservationFormSubmit = () => {
    setShowObservationForm(false);
    setEditingObservation(null);
    // ObservationList will re-fetch internally or needs a trigger
  };

  const handleObservationFormCancel = () => {
    setShowObservationForm(false);
    setEditingObservation(null);
  };
  
  const canManage = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN');

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Patient Observations</h1>
        {error && <div className="alert alert-danger">{error}</div>}

        {currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN') && (
          <div className="mb-3 col-md-6">
            <label htmlFor="patientSelectForObservation" className="form-label">Select Patient:</label>
            <select 
              id="patientSelectForObservation" 
              className="form-select" 
              value={selectedPatientUserId}
              onChange={(e) => {
                setSelectedPatientUserId(e.target.value);
                setShowObservationForm(false);
                setEditingObservation(null);
              }}
            >
              <option value="">-- Select a Patient --</option>
              {patients.map(p => (
                <option key={p.user.id} value={p.user.id}>
                  {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {(currentUser?.role === 'PATIENT' && !selectedPatientUserId) && setSelectedPatientUserId(currentUser.id)}

        {selectedPatientUserId && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Observations for Patient ID: {selectedPatientUserId}</h4>
              {canManage && !showObservationForm && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleEditObservation(null)}
                >
                  Add New Observation
                </button>
              )}
            </div>

            {showObservationForm ? (
              <ObservationForm
                patientUserId={selectedPatientUserId}
                observationId={editingObservation ? editingObservation.id : null}
                onFormSubmit={handleObservationFormSubmit}
                onCancel={handleObservationFormCancel}
              />
            ) : (
              <ObservationList 
                patientUserId={selectedPatientUserId} 
                onEditObservation={handleEditObservation} 
              />
            )}
          </>
        )}
        {!selectedPatientUserId && currentUser && (currentUser.role !== 'PATIENT') && (
            <p className="text-muted">Please select a patient to view or manage their observations.</p>
        )}
      </div>
    </div>
  );
};

export default ObservationsPage;
