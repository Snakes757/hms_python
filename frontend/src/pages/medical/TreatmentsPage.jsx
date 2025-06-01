// src/pages/medical/TreatmentsPage.jsx
import React, { useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom'; // To potentially get patientId from state or query
import TreatmentList from '../../components/medical/TreatmentList';
import TreatmentForm from '../../components/medical/TreatmentForm';
import Sidebar from '../../components/common/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { listAllPatients } from '../../api/patients'; // For staff to select patient

const TreatmentsPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const location = useLocation();
  // Attempt to get patientUserId from location state (if navigated from patient profile) or a query param
  const preselectedPatientUserId = location.state?.patientUserId || new URLSearchParams(location.search).get('patientUserId');

  const [selectedPatientUserId, setSelectedPatientUserId] = useState(preselectedPatientUserId || '');
  const [patients, setPatients] = useState([]); // For staff to select a patient
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null); // null for new, or treatment object for edit
  const [error, setError] = useState('');


  // Fetch patients if current user is staff, to allow selection
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


  const handleEditTreatment = (treatment) => {
    setEditingTreatment(treatment);
    setShowTreatmentForm(true);
  };

  const handleTreatmentFormSubmit = () => {
    setShowTreatmentForm(false);
    setEditingTreatment(null);
    // TreatmentList will re-fetch if selectedPatientUserId changes or internally
  };

  const handleTreatmentFormCancel = () => {
    setShowTreatmentForm(false);
    setEditingTreatment(null);
  };
  
  const canManage = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN');


  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Patient Treatments</h1>
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Patient Selector for Staff */}
        {currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN') && (
          <div className="mb-3 col-md-6">
            <label htmlFor="patientSelectForTreatment" className="form-label">Select Patient:</label>
            <select 
              id="patientSelectForTreatment" 
              className="form-select" 
              value={selectedPatientUserId}
              onChange={(e) => {
                setSelectedPatientUserId(e.target.value);
                setShowTreatmentForm(false); // Hide form when patient changes
                setEditingTreatment(null);
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
        
        {/* If current user is patient, their ID is used implicitly */}
        {(currentUser?.role === 'PATIENT' && !selectedPatientUserId) && setSelectedPatientUserId(currentUser.id)}


        {selectedPatientUserId && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Treatments for Patient ID: {selectedPatientUserId}</h4>
              {canManage && !showTreatmentForm && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleEditTreatment(null)}
                >
                  Add New Treatment
                </button>
              )}
            </div>

            {showTreatmentForm ? (
              <TreatmentForm
                patientUserId={selectedPatientUserId}
                treatmentId={editingTreatment ? editingTreatment.id : null}
                onFormSubmit={handleTreatmentFormSubmit}
                onCancel={handleTreatmentFormCancel}
              />
            ) : (
              <TreatmentList 
                patientUserId={selectedPatientUserId} 
                onEditTreatment={handleEditTreatment} 
              />
            )}
          </>
        )}
        {!selectedPatientUserId && currentUser && (currentUser.role !== 'PATIENT') && (
            <p className="text-muted">Please select a patient to view or manage their treatments.</p>
        )}
      </div>
    </div>
  );
};

export default TreatmentsPage;
