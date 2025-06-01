// src/pages/patients/PatientProfilePage.jsx
import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import PatientProfile from '../../components/patients/PatientProfile';
import Sidebar from '../../components/common/Sidebar';
import PrescriptionList from '../../components/medical/PrescriptionList';
import PrescriptionForm from '../../components/medical/PrescriptionForm';
import TreatmentList from '../../components/medical/TreatmentList';
import TreatmentForm from '../../components/medical/TreatmentForm';
import ObservationList from '../../components/medical/ObservationList'; // Import ObservationList
import ObservationForm from '../../components/medical/ObservationForm'; // Import ObservationForm
import { AuthContext } from '../../context/AuthContext';

const PatientProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useContext(AuthContext);

  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);

  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);

  const [showObservationForm, setShowObservationForm] = useState(false);
  const [editingObservation, setEditingObservation] = useState(null);

  const canManagePrescriptions = currentUser && currentUser.role === 'DOCTOR';
  const canManageTreatments = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE');
  const canManageObservations = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE');

  // Prescription Handlers
  const handleEditPrescription = (prescription) => {
    setEditingPrescription(prescription);
    setShowPrescriptionForm(true);
  };
  const handlePrescriptionFormSubmit = () => {
    setShowPrescriptionForm(false);
    setEditingPrescription(null);
  };
  const handlePrescriptionFormCancel = () => {
    setShowPrescriptionForm(false);
    setEditingPrescription(null);
  };

  // Treatment Handlers
  const handleEditTreatment = (treatment) => {
    setEditingTreatment(treatment);
    setShowTreatmentForm(true);
  };
  const handleTreatmentFormSubmit = () => {
    setShowTreatmentForm(false);
    setEditingTreatment(null);
  };
  const handleTreatmentFormCancel = () => {
    setShowTreatmentForm(false);
    setEditingTreatment(null);
  };

  // Observation Handlers
  const handleEditObservation = (observation) => {
    setEditingObservation(observation);
    setShowObservationForm(true);
  };
  const handleObservationFormSubmit = () => {
    setShowObservationForm(false);
    setEditingObservation(null);
  };
  const handleObservationFormCancel = () => {
    setShowObservationForm(false);
    setEditingObservation(null);
  };


  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <PatientProfile patientUserId={userId} />

        {/* Prescriptions Section */}
        <div className="card shadow-sm mt-4 mb-4">
          <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Prescriptions</h4>
            {canManagePrescriptions && !showPrescriptionForm && (
              <button 
                className="btn btn-light btn-sm" 
                onClick={() => handleEditPrescription(null)}
              >
                Add New Prescription
              </button>
            )}
          </div>
          <div className="card-body">
            {showPrescriptionForm ? (
              <PrescriptionForm
                patientUserId={userId}
                prescriptionId={editingPrescription ? editingPrescription.id : null}
                onFormSubmit={handlePrescriptionFormSubmit}
                onCancel={handlePrescriptionFormCancel}
              />
            ) : (
              <PrescriptionList 
                patientUserId={userId} 
                onEditPrescription={canManagePrescriptions ? handleEditPrescription : undefined}
              />
            )}
          </div>
        </div>

        {/* Treatments Section */}
        <div className="card shadow-sm mt-4 mb-4">
          <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Treatments</h4>
            {canManageTreatments && !showTreatmentForm && (
              <button 
                className="btn btn-dark btn-sm" 
                onClick={() => handleEditTreatment(null)}
              >
                Add New Treatment
              </button>
            )}
          </div>
          <div className="card-body">
            {showTreatmentForm ? (
              <TreatmentForm
                patientUserId={userId}
                treatmentId={editingTreatment ? editingTreatment.id : null}
                onFormSubmit={handleTreatmentFormSubmit}
                onCancel={handleTreatmentFormCancel}
              />
            ) : (
              <TreatmentList 
                patientUserId={userId} 
                onEditTreatment={canManageTreatments ? handleEditTreatment : undefined}
              />
            )}
          </div>
        </div>
        
        {/* Observations Section */}
        <div className="card shadow-sm mt-4 mb-4">
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Observations</h4>
            {canManageObservations && !showObservationForm && (
              <button 
                className="btn btn-light btn-sm" 
                onClick={() => handleEditObservation(null)}
              >
                Add New Observation
              </button>
            )}
          </div>
          <div className="card-body">
            {showObservationForm ? (
              <ObservationForm
                patientUserId={userId}
                observationId={editingObservation ? editingObservation.id : null}
                onFormSubmit={handleObservationFormSubmit}
                onCancel={handleObservationFormCancel}
              />
            ) : (
              <ObservationList 
                patientUserId={userId} 
                onEditObservation={canManageObservations ? handleEditObservation : undefined}
              />
            )}
          </div>
        </div> 

      </div>
    </div>
  );
};

export default PatientProfilePage;
