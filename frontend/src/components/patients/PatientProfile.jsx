// src/components/patients/PatientProfile.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getPatientByUserId, updatePatientByUserId } from '../../api/patients';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import MedicalRecordsList from '../medical/MedicalRecordsList'; // Renamed from MedicalRecords
// import { useNavigate } from 'react-router-dom';

const GENDERS = [ // From patients/models.py
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];


const PatientProfile = ({ patientUserId }) => {
  const [patient, setPatient] = useState(null);
  const [editableProfile, setEditableProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const { user: currentUser } = useContext(AuthContext);
  // const navigate = useNavigate();

  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!patientUserId) {
        setError("Patient User ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const data = await getPatientByUserId(patientUserId);
        setPatient(data);
        // Initialize editableProfile with fetched data, ensure all fields exist
        setEditableProfile({
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch patient profile.');
        console.error("Error fetching patient profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatientProfile();
  }, [patientUserId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const updatedData = await updatePatientByUserId(patientUserId, editableProfile);
      setPatient(updatedData); // Update displayed patient data
      setEditableProfile({ // Reset editable form data based on new patient data
          date_of_birth: updatedData.date_of_birth || '',
          gender: updatedData.gender || '',
          address: updatedData.address || '',
          phone_number: updatedData.phone_number || '',
          emergency_contact_name: updatedData.emergency_contact_name || '',
          emergency_contact_phone: updatedData.emergency_contact_phone || '',
      });
      setSuccess('Patient profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to update patient profile.');
      console.error("Error updating patient profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if the current user can edit this profile
  const canEdit = currentUser && (
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'RECEPTIONIST' ||
    (currentUser.role === 'PATIENT' && currentUser.id === parseInt(patientUserId))
    // Doctors/Nurses might have limited edit rights, handle as per specific requirements
  );


  if (isLoading && !patient) { // Show loading only if patient data isn't there yet
    return <LoadingSpinner message="Loading patient profile..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!patient) {
    return <div className="alert alert-warning mt-3">Patient profile not found.</div>;
  }

  // Patient's basic user info (from nested user object)
  const { user: patientUserInfo } = patient;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Patient: {patientUserInfo.first_name} {patientUserInfo.last_name}</h4>
          {canEdit && !editMode && (
            <button className="btn btn-light btn-sm" onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          )}
        </div>
        <div className="card-body">
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Email:</label>
                <p className="form-control-plaintext">{patientUserInfo.email}</p>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Username:</label>
                <p className="form-control-plaintext">{patientUserInfo.username}</p>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="date_of_birth" className="form-label fw-bold">Date of Birth:</label>
                {editMode ? (
                  <input type="date" className="form-control" id="date_of_birth" name="date_of_birth" value={editableProfile.date_of_birth} onChange={handleInputChange} />
                ) : (
                  <p className="form-control-plaintext">{patient.date_of_birth || 'N/A'}</p>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="gender" className="form-label fw-bold">Gender:</label>
                {editMode ? (
                  <select className="form-select" id="gender" name="gender" value={editableProfile.gender} onChange={handleInputChange}>
                    <option value="">Select Gender</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                ) : (
                  <p className="form-control-plaintext">{patient.gender_display || patient.gender || 'N/A'}</p>
                )}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="address" className="form-label fw-bold">Address:</label>
              {editMode ? (
                <textarea className="form-control" id="address" name="address" rows="3" value={editableProfile.address} onChange={handleInputChange}></textarea>
              ) : (
                <p className="form-control-plaintext">{patient.address || 'N/A'}</p>
              )}
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="phone_number" className="form-label fw-bold">Phone Number:</label>
                {editMode ? (
                  <input type="tel" className="form-control" id="phone_number" name="phone_number" value={editableProfile.phone_number} onChange={handleInputChange} />
                ) : (
                  <p className="form-control-plaintext">{patient.phone_number || 'N/A'}</p>
                )}
              </div>
            </div>
            <h5 className="mt-4">Emergency Contact</h5>
            <hr/>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="emergency_contact_name" className="form-label fw-bold">Name:</label>
                {editMode ? (
                  <input type="text" className="form-control" id="emergency_contact_name" name="emergency_contact_name" value={editableProfile.emergency_contact_name} onChange={handleInputChange} />
                ) : (
                  <p className="form-control-plaintext">{patient.emergency_contact_name || 'N/A'}</p>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="emergency_contact_phone" className="form-label fw-bold">Phone:</label>
                {editMode ? (
                  <input type="tel" className="form-control" id="emergency_contact_phone" name="emergency_contact_phone" value={editableProfile.emergency_contact_phone} onChange={handleInputChange} />
                ) : (
                  <p className="form-control-plaintext">{patient.emergency_contact_phone || 'N/A'}</p>
                )}
              </div>
            </div>

            {editMode && (
              <div className="d-flex justify-content-end mt-3">
                <button type="button" className="btn btn-secondary me-2" onClick={() => { setEditMode(false); setError(''); setSuccess(''); setEditableProfile({ date_of_birth: patient.date_of_birth || '', gender: patient.gender || '', address: patient.address || '', phone_number: patient.phone_number || '', emergency_contact_name: patient.emergency_contact_name || '', emergency_contact_phone: patient.emergency_contact_phone || '' }); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Medical Records Section */}
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h4 className="mb-0">Medical Records</h4>
        </div>
        <div className="card-body">
          <MedicalRecordsList patientUserId={patientUserId} />
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
