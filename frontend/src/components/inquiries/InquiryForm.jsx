// src/components/inquiries/InquiryForm.jsx
import React, { useState, useContext, useEffect } from 'react';
import { submitInquiry, updateInquiry, getInquiryDetails } from '../../api/inquiries';
import { listAllPatients } from '../../api/patients'; // For staff to link to a patient
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';

// Based on backend models.py InquirySource
const INQUIRY_SOURCES = [
    { value: 'PHONE', label: 'Phone Call' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'WALK_IN', label: 'Walk-In' },
    { value: 'WEB_PORTAL', label: 'Web Portal Form' },
    { value: 'CHAT', label: 'Live Chat' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'OTHER', label: 'Other' },
];

// Based on backend models.py InquiryStatus - for staff editing
const INQUIRY_STATUS_CHOICES_STAFF = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'PENDING_PATIENT', label: 'Pending Patient Response' },
    { value: 'ON_HOLD', label: 'On Hold' },
];


const InquiryForm = ({ inquiryId, isManaging = false }) => { // isManaging for staff editing existing inquiry
  const { user: currentUser, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    inquirer_name: '',
    inquirer_email: '',
    inquirer_phone: '',
    patient: '', // Patient User ID (optional, for staff linking)
    source: INQUIRY_SOURCES[0].value, // Default source
    // Fields for staff management
    status: 'OPEN', 
    handled_by: '', // User ID of staff
    resolution_notes: '',
  });

  const [patients, setPatients] = useState([]); // For staff to select patient
  const [staffUsers, setStaffUsers] = useState([]); // For admin/receptionist to assign handler
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(inquiryId) && isManaging;

  // Pre-fill inquirer details if user is logged in and is a patient
  useEffect(() => {
    if (currentUser && currentUser.role === 'PATIENT' && !isEditing) {
      setFormData(prev => ({
        ...prev,
        inquirer_name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username,
        inquirer_email: currentUser.email,
        patient: currentUser.id, // Link to current patient user
      }));
    } else if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'NURSE') && !isEditing) {
        // Staff creating a new inquiry on behalf of someone
        setFormData(prev => ({...prev, handled_by: currentUser.id })); // Default handler to current staff
    }
  }, [currentUser, isEditing]);

  // Fetch data for editing or for staff selections
  useEffect(() => {
    const loadData = async () => {
      if (isEditing && inquiryId) {
        setIsLoading(true);
        try {
          const data = await getInquiryDetails(inquiryId);
          setFormData({
            subject: data.subject || '',
            description: data.description || '',
            inquirer_name: data.inquirer_name || '',
            inquirer_email: data.inquirer_email || '',
            inquirer_phone: data.inquirer_phone || '',
            patient: data.patient_details?.user?.id || '',
            source: data.source || INQUIRY_SOURCES[0].value,
            status: data.status || 'OPEN',
            handled_by: data.handled_by_details?.id || '',
            resolution_notes: data.resolution_notes || '',
          });
        } catch (err) {
          setError("Failed to load inquiry details: " + err.message);
        } finally {
          setIsLoading(false);
        }
      }

      // Staff might need to select a patient or assign a handler
      if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'NURSE')) {
        try {
          const patientsData = await listAllPatients(); // Assuming this API exists and is appropriate
          setPatients(patientsData || []);
          
          // TODO: Fetch list of staff users (Admin, Receptionist, Nurse) for 'handled_by' field
          // This would typically come from /api/v1/users/ filtered by role
          // For now, this part is omitted for brevity.
          // const staffData = await listStaffUsers(); 
          // setStaffUsers(staffData || []);
        } catch (err) {
          console.error("Failed to load support data for inquiry form:", err);
        }
      }
    };
    loadData();
  }, [inquiryId, isEditing, currentUser]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    let payload = { ...formData };
    if (!payload.patient) delete payload.patient; // Send null or omit if not selected
    else payload.patient = parseInt(payload.patient, 10);

    if (isManaging) { // Staff editing specific fields
        if (!payload.handled_by) delete payload.handled_by;
        else payload.handled_by = parseInt(payload.handled_by, 10);
    } else { // New submission, don't send staff management fields unless staff is submitting for someone
        delete payload.status;
        delete payload.handled_by;
        delete payload.resolution_notes;
        if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'NURSE')) {
            // If staff is submitting, they can set initial status or handler if form allows
            // For now, keeping it simple: these are managed on the details/edit page for staff.
        }
    }


    try {
      if (isEditing) {
        await updateInquiry(inquiryId, payload);
        setSuccess('Inquiry updated successfully!');
      } else {
        await submitInquiry(payload);
        setSuccess('Inquiry submitted successfully! We will get back to you soon.');
        // Reset form for new public submission
        if (!currentUser || currentUser.role === 'PATIENT') { // Reset if public or patient submitted
            setFormData({
                subject: '', description: '', inquirer_name: '', inquirer_email: '',
                inquirer_phone: '', patient: (currentUser?.role === 'PATIENT' ? currentUser.id : ''), 
                source: INQUIRY_SOURCES[0].value,
                status: 'OPEN', handled_by: '', resolution_notes: '',
            });
        }
      }
      // navigate('/inquiries'); // Or to details page
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'submit'} inquiry.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading && isEditing && !formData.subject) {
    return <LoadingSpinner message="Loading inquiry details..." />;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">{isEditing ? 'Manage Inquiry' : 'Submit New Inquiry'}</h4>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label htmlFor="subject" className="form-label">Subject / Reason for Inquiry <span className="text-danger">*</span></label>
                <input type="text" className="form-control" id="subject" name="subject" value={formData.subject} onChange={handleChange} required disabled={isEditing && !isManaging}/>
            </div>
            <div className="mb-3">
                <label htmlFor="description" className="form-label">Detailed Description <span className="text-danger">*</span></label>
                <textarea className="form-control" id="description" name="description" rows="4" value={formData.description} onChange={handleChange} required disabled={isEditing && !isManaging}></textarea>
            </div>
            
            {!isEditing && ( // Only show these for new submissions, or if staff is editing and needs to correct them
            <>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="inquirer_name" className="form-label">Your Name {(!currentUser || currentUser.role !== 'PATIENT') && <span className="text-danger">*</span>}</label>
                        <input type="text" className="form-control" id="inquirer_name" name="inquirer_name" value={formData.inquirer_name} onChange={handleChange} required={!currentUser || currentUser.role !== 'PATIENT'} disabled={currentUser?.role === 'PATIENT'}/>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="inquirer_email" className="form-label">Your Email</label>
                        <input type="email" className="form-control" id="inquirer_email" name="inquirer_email" value={formData.inquirer_email} onChange={handleChange} disabled={currentUser?.role === 'PATIENT'}/>
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="inquirer_phone" className="form-label">Your Phone Number</label>
                    <input type="tel" className="form-control" id="inquirer_phone" name="inquirer_phone" value={formData.inquirer_phone} onChange={handleChange} />
                </div>
            </>
            )}

            {/* Fields for staff managing/creating */}
            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'NURSE') && (
            <>
                <hr/>
                <h5 className="mb-3">Staff Section</h5>
                <div className="mb-3">
                    <label htmlFor="inq_patient_link" className="form-label">Link to Existing Patient (Optional)</label>
                    <select id="inq_patient_link" name="patient" className="form-select" value={formData.patient} onChange={handleChange} disabled={patients.length === 0 || (isEditing && !isManaging)}>
                        <option value="">None</option>
                        {patients.map(p => (
                        <option key={p.user.id} value={p.user.id}>
                            {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                        </option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label htmlFor="inq_source" className="form-label">Source of Inquiry</label>
                    <select id="inq_source" name="source" className="form-select" value={formData.source} onChange={handleChange} disabled={isEditing && !isManaging}>
                        {INQUIRY_SOURCES.map(src => (<option key={src.value} value={src.value}>{src.label}</option>))}
                    </select>
                </div>
                
                {isManaging && ( // Only show these if staff is actively managing (editing)
                <>
                    <div className="mb-3">
                        <label htmlFor="inq_status" className="form-label">Status</label>
                        <select id="inq_status" name="status" className="form-select" value={formData.status} onChange={handleChange}>
                            {INQUIRY_STATUS_CHOICES_STAFF.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="inq_handled_by" className="form-label">Handled By (Staff)</label>
                        <select id="inq_handled_by" name="handled_by" className="form-select" value={formData.handled_by} onChange={handleChange}>
                            <option value="">Unassigned</option>
                            {/* Populate with staff users later */}
                            {/* {staffUsers.map(staff => (<option key={staff.id} value={staff.id}>{staff.first_name} {staff.last_name}</option>))} */}
                             {currentUser && <option value={currentUser.id}>Assign to Me ({currentUser.first_name})</option>}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="resolution_notes" className="form-label">Resolution Notes</label>
                        <textarea className="form-control" id="resolution_notes" name="resolution_notes" rows="3" value={formData.resolution_notes} onChange={handleChange}></textarea>
                    </div>
                </>
                )}
            </>
            )}


          <div className="d-flex justify-content-end mt-3">
            {isManaging && <button type="button" className="btn btn-outline-secondary me-2" onClick={() => navigate(`/inquiries/${inquiryId}`)}>Cancel Edit</button>}
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Inquiry' : 'Submit Inquiry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryForm;
