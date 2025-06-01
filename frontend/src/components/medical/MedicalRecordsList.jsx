// src/components/medical/MedicalRecordsList.jsx
// This component was previously named MedicalRecords.jsx, renamed for clarity.
import React, { useState, useEffect, useContext } from 'react';
import { listMedicalRecordsForPatient, deleteMedicalRecord, createMedicalRecord, updateMedicalRecord } from '../../api/medicalRecords';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
// import { Link } from 'react-router-dom'; // For linking to record details if a separate page exists

const MedicalRecordsList = ({ patientUserId }) => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // null or record object
  const [newRecordData, setNewRecordData] = useState({
    diagnosis: '',
    symptoms: '',
    treatment_plan: '',
    notes: '',
    record_date: new Date().toISOString().slice(0, 16), // Default to now, format for datetime-local
  });

  const fetchRecords = async () => {
    if (!patientUserId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await listMedicalRecordsForPatient(patientUserId);
      setRecords(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch medical records.');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientUserId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingRecord) {
        setEditingRecord(prev => ({ ...prev, [name]: value }));
    } else {
        setNewRecordData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        const dataToSubmit = editingRecord ? { ...editingRecord } : { ...newRecordData };
        // The API expects created_by to be set by the backend based on the token.
        // Patient ID is part of the URL.
        if (editingRecord) {
            await updateMedicalRecord(patientUserId, editingRecord.id, dataToSubmit);
        } else {
            await createMedicalRecord(patientUserId, dataToSubmit);
        }
        setShowAddForm(false);
        setEditingRecord(null);
        setNewRecordData({ diagnosis: '', symptoms: '', treatment_plan: '', notes: '', record_date: new Date().toISOString().slice(0, 16) });
        fetchRecords(); // Refresh the list
    } catch (err) {
        setError(err.message || `Failed to ${editingRecord ? 'update' : 'add'} medical record.`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      setIsLoading(true);
      setError('');
      try {
        await deleteMedicalRecord(patientUserId, recordId);
        fetchRecords(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to delete medical record.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openEditForm = (record) => {
    setEditingRecord({
        ...record,
        record_date: record.record_date ? new Date(record.record_date).toISOString().slice(0,16) : new Date().toISOString().slice(0,16)
    });
    setShowAddForm(true);
  };

  const canManageRecords = currentUser && (currentUser.role === 'DOCTOR' || currentUser.role === 'NURSE' || currentUser.role === 'ADMIN');

  if (isLoading && records.length === 0) { // Show loading only if records aren't there yet
    return <LoadingSpinner message="Loading medical records..." />;
  }

  return (
    <div className="mt-0"> {/* Removed mt-4 to fit better in PatientProfile card */}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      
      {canManageRecords && !showAddForm && (
        <button className="btn btn-success mb-3" onClick={() => { setShowAddForm(true); setEditingRecord(null); setNewRecordData({ diagnosis: '', symptoms: '', treatment_plan: '', notes: '', record_date: new Date().toISOString().slice(0, 16) }); }}>
          <i className="bi bi-plus-circle me-2"></i>Add New Medical Record
        </button>
      )}

      {showAddForm && (
        <div className="card mb-4">
          <div className="card-header">
            {editingRecord ? 'Edit Medical Record' : 'Add New Medical Record'}
          </div>
          <div className="card-body">
            <form onSubmit={handleFormSubmit}>
              <div className="mb-3">
                <label htmlFor="record_date" className="form-label">Record Date & Time</label>
                <input type="datetime-local" className="form-control" id="record_date" name="record_date" 
                       value={editingRecord ? editingRecord.record_date : newRecordData.record_date} 
                       onChange={handleInputChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="diagnosis" className="form-label">Diagnosis</label>
                <textarea className="form-control" id="diagnosis" name="diagnosis" rows="2" 
                          value={editingRecord ? editingRecord.diagnosis : newRecordData.diagnosis} 
                          onChange={handleInputChange}></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="symptoms" className="form-label">Symptoms</label>
                <textarea className="form-control" id="symptoms" name="symptoms" rows="2" 
                          value={editingRecord ? editingRecord.symptoms : newRecordData.symptoms} 
                          onChange={handleInputChange}></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="treatment_plan" className="form-label">Treatment Plan</label>
                <textarea className="form-control" id="treatment_plan" name="treatment_plan" rows="2" 
                          value={editingRecord ? editingRecord.treatment_plan : newRecordData.treatment_plan} 
                          onChange={handleInputChange}></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes</label>
                <textarea className="form-control" id="notes" name="notes" rows="2" 
                          value={editingRecord ? editingRecord.notes : newRecordData.notes} 
                          onChange={handleInputChange}></textarea>
              </div>
              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={() => {setShowAddForm(false); setEditingRecord(null);}}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingRecord ? 'Update Record' : 'Add Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {records.length === 0 && !isLoading && !showAddForm && (
        <p className="text-muted">No medical records found for this patient.</p>
      )}

      {records.length > 0 && (
        <div className="list-group">
          {records.map((record) => (
            <div key={record.id} className="list-group-item list-group-item-action flex-column align-items-start mb-2 shadow-sm border-start-primary"> {/* Added border-start-primary for a bit of style */}
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">Diagnosis: {record.diagnosis || 'N/A'}</h5>
                <small className="text-muted">{new Date(record.record_date).toLocaleString()}</small>
              </div>
              <p className="mb-1"><strong>Symptoms:</strong> {record.symptoms || 'N/A'}</p>
              <p className="mb-1"><strong>Treatment Plan:</strong> {record.treatment_plan || 'N/A'}</p>
              {record.notes && <p className="mb-1"><strong>Notes:</strong> {record.notes}</p>}
              <small className="text-muted">Recorded by: {record.created_by_details?.first_name || 'N/A'} {record.created_by_details?.last_name || ''} ({record.created_by_details?.role_display || 'Unknown Role'})</small>
              {canManageRecords && (
                <div className="mt-2 text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEditForm(record)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRecord(record.id)} disabled={isLoading}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsList;
