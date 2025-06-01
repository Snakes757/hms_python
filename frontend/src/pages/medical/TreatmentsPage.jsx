import React, { useState, useContext, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import TreatmentList from "../../components/medical/TreatmentList";
import TreatmentForm from "../../components/medical/TreatmentForm";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { AuthContext } from "../../context/AuthContext";
import { patientsApi } from "../../api";
import usePermissions from "../../hooks/usePermissions";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const TreatmentsPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const { can, isRole } = usePermissions();
  const location = useLocation();
  const params = useParams();

  const patientIdFromUrl = params.patientUserId;
  const patientIdFromState = location.state?.patientUserId;
  const patientIdFromQuery = new URLSearchParams(location.search).get(
    "patientUserId"
  );

  const [selectedPatientUserId, setSelectedPatientUserId] = useState(
    patientIdFromUrl ||
      patientIdFromState ||
      patientIdFromQuery ||
      (isRole.isPatient ? currentUser?.id?.toString() : "")
  );

  const [patientName, setPatientName] = useState("");
  const [patients, setPatients] = useState([]);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [error, setError] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (isRole.isPatient && currentUser && !selectedPatientUserId) {
      setSelectedPatientUserId(currentUser.id.toString());
    } else if (can("VIEW_PATIENT_LIST") && !isRole.isPatient) {
      setLoadingPatients(true);
      patientsApi
        .listAllPatients()
        .then((data) => {
          const patientList = data?.results || data || [];
          setPatients(patientList);
          if (selectedPatientUserId) {
            const foundPatient = patientList.find(
              (p) => p.user.id.toString() === selectedPatientUserId
            );
            if (foundPatient) {
              setPatientName(
                `${foundPatient.user.first_name} ${foundPatient.user.last_name}`
              );
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch patients for selection:", err);
          setError("Could not load patient list for selection.");
        })
        .finally(() => setLoadingPatients(false));
    } else if (selectedPatientUserId && !patientName && !isRole.isPatient) {
      setLoadingPatients(true);
      patientsApi
        .getPatientByUserId(selectedPatientUserId)
        .then((data) => {
          setPatientName(`${data.user.first_name} ${data.user.last_name}`);
        })
        .catch((err) => console.error("Failed to fetch patient name:", err))
        .finally(() => setLoadingPatients(false));
    } else if (
      isRole.isPatient &&
      currentUser &&
      selectedPatientUserId === currentUser.id.toString() &&
      !patientName
    ) {
      setPatientName(`${currentUser.first_name} ${currentUser.last_name}`);
    }
  }, [currentUser, isRole.isPatient, can, selectedPatientUserId, patientName]);

  const handleEditTreatment = (treatment) => {
    setEditingTreatment(treatment);
    setShowTreatmentForm(true);
  };

  const handleTreatmentFormSubmitOrCancel = () => {
    setShowTreatmentForm(false);
    setEditingTreatment(null);
    // Optionally re-fetch treatments
  };

  const canManageTreatments =
    can("RECORD_TREATMENT") || can("MANAGE_TREATMENT");
  const pageTitle =
    selectedPatientUserId && patientName
      ? `Treatments: ${patientName} (ID: ${selectedPatientUserId})`
      : isRole.isPatient
      ? "My Treatments"
      : "Patient Treatments";

  return (
    <ProtectedRoute>
      <PageWithSidebar title={pageTitle}>
        <div className="bg-white p-6 rounded-lg shadow-xl space-y-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {!isRole.isPatient && can("VIEW_PATIENT_LIST") && (
            <div className="mb-4">
              <label
                htmlFor="patientSelectForTreatment"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Patient:
              </label>
              {loadingPatients && !patients.length ? (
                <LoadingSpinner size="sm" message="Loading patients..." />
              ) : (
                <select
                  id="patientSelectForTreatment"
                  className="mt-1 block w-full md:w-1/2 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                  value={selectedPatientUserId}
                  onChange={(e) => {
                    const newPatientId = e.target.value;
                    setSelectedPatientUserId(newPatientId);
                    const selectedP = patients.find(
                      (p) => p.user.id.toString() === newPatientId
                    );
                    setPatientName(
                      selectedP
                        ? `${selectedP.user.first_name} ${selectedP.user.last_name}`
                        : ""
                    );
                    setShowTreatmentForm(false);
                    setEditingTreatment(null);
                  }}
                >
                  <option value="">-- Select a Patient --</option>
                  {patients.map((p) => (
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
              {canManageTreatments && !showTreatmentForm && (
                <div className="flex justify-end mb-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 shadow-sm transition"
                    onClick={() => handleEditTreatment(null)} // Pass null for new treatment
                  >
                    Add New Treatment
                  </button>
                </div>
              )}

              {showTreatmentForm ? (
                <TreatmentForm
                  patientUserId={selectedPatientUserId}
                  treatmentId={editingTreatment ? editingTreatment.id : null}
                  onFormSubmit={handleTreatmentFormSubmitOrCancel}
                  onCancel={handleTreatmentFormSubmitOrCancel}
                />
              ) : (
                <TreatmentList
                  patientUserId={selectedPatientUserId}
                  onEditTreatment={
                    canManageTreatments ? handleEditTreatment : undefined
                  }
                />
              )}
            </>
          ) : (
            !isRole.isPatient && (
              <p className="text-gray-500">
                Please select a patient to view or manage their treatments.
              </p>
            )
          )}
          {isRole.isPatient && !selectedPatientUserId && (
            <LoadingSpinner message="Loading your treatments..." />
          )}
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default TreatmentsPage;
