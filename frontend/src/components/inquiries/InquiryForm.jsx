import React, { useState, useContext, useEffect } from 'react';
import { submitInquiry, updateInquiry, getInquiryDetails } from '../../api/inquiries';
import { listAllPatients } from '../../api/patients'; // For staff linking inquiries to patients
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom'; // useParams for editing
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants';

const INQUIRY_SOURCES = [
    { value: 'PHONE', label: 'Phone Call' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'WALK_IN', label: 'Walk-In' },
    { value: 'WEB_PORTAL', label: 'Web Portal Form' },
    { value: 'CHAT', label: 'Live Chat' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'OTHER', label: 'Other' },
];

const INQUIRY_STATUS_CHOICES_STAFF = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'PENDING_PATIENT', label: 'Pending Patient Response' },
    { value: 'ON_HOLD', label: 'On Hold' },
];

// Note: inquiryId prop is used when this form is for editing an existing inquiry by staff.
// isManaging prop differentiates between a patient submitting a new inquiry vs. staff managing one.
const InquiryForm = ({ inquiryId: propInquiryId, isManaging: propIsManaging = false }) => {
  const { inquiryId: routeInquiryId } = useParams(); // For when this form is on a dedicated edit page
  const inquiryId = propInquiryId || routeInquiryId;
  const isManaging = propIsManaging || Boolean(inquiryId); // If inquiryId is present, assume managing

  const { user: currentUser, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    inquirer_name: '',
    inquirer_email: '',
    inquirer_phone: '',
    patient: '', // ID of the linked patient (if any)
    source: INQUIRY_SOURCES.find(s => s.value === 'WEB_PORTAL')?.value || INQUIRY_SOURCES[0].value, // Default to WEB_PORTAL or first
    // Staff-only fields for managing inquiries
    status: 'OPEN',
    handled_by: '', // ID of the staff member handling it
    resolution_notes: '',
  });

  const [patients, setPatients] = useState([]);
  // const [staffUsers, setStaffUsers] = useState([]); // If needed for 'handled_by' dropdown
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEditing = Boolean(inquiryId) && isManaging;

  useEffect(() => {
    // Pre-fill form if current user is a patient and not editing/managing
    if (currentUser && currentUser.role === USER_ROLES.PATIENT && !isEditing) {
      setFormData(prev => ({
        ...prev,
        inquirer_name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username,
        inquirer_email: currentUser.email,
        patient: currentUser.id.toString(), // Automatically link to self
        source: 'WEB_PORTAL', // Default for patient submissions via portal
      }));
    } else if (currentUser && isManaging && !isEditing) {
        // If staff is creating an inquiry (e.g., logging a phone call)
        setFormData(prev => ({...prev, handled_by: currentUser.id.toString() }));
    }
  }, [currentUser, isEditing]);

  useEffect(() => {
    const loadDataForManagement = async () => {
      setIsLoading(true);
      try {
        if (isEditing && inquiryId) {
          const data = await getInquiryDetails(inquiryId);
          setFormData({
            subject: data.subject || '',
            description: data.description || '',
            inquirer_name: data.inquirer_name || '',
            inquirer_email: data.inquirer_email || '',
            inquirer_phone: data.inquirer_phone || '',
            patient: data.patient_details?.user?.id?.toString() || '',
            source: data.source || INQUIRY_SOURCES[0].value,
            status: data.status || 'OPEN',
            handled_by: data.handled_by_details?.id?.toString() || '',
            resolution_notes: data.resolution_notes || '',
          });
        }
        // Load patients if staff is managing/creating inquiry
        if (currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST || currentUser.role === USER_ROLES.NURSE)) {
          const patientsData = await listAllPatients();
          setPatients(patientsData?.results || patientsData || []);
          // Potentially load staff users for 'handled_by' field if needed
        }
      } catch (err) {
        setError("Failed to load initial data: " + err.message);
        console.error("Error loading data for InquiryForm:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isManaging) { // Only load patients/staff if staff is managing
        loadDataForManagement();
    } else if (currentUser && currentUser.role === USER_ROLES.PATIENT && !isEditing) {
        // Patient submitting new inquiry, no extra data needed beyond prefill
        setIsLoading(false);
    } else if (!currentUser && !isEditing) { // Public submission
        setIsLoading(false);
    }

  }, [inquiryId, isEditing, currentUser, isManaging]);

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
    // Clean up payload
    payload.patient = payload.patient ? parseInt(payload.patient, 10) : null;
    
    if (isManaging) {
        payload.handled_by = payload.handled_by ? parseInt(payload.handled_by, 10) : null;
    } else { // If not managing (i.e., patient or public submitting new)
        delete payload.status;
        delete payload.handled_by;
        delete payload.resolution_notes;
        // If it's a public (not logged in) submission, ensure patient ID is not sent if empty
        if (!currentUser && !payload.patient) {
            delete payload.patient;
        }
    }
    // Ensure empty strings are not sent for optional fields if backend expects null
    ['inquirer_email', 'inquirer_phone', 'resolution_notes'].forEach(key => {
        if (payload[key] === '') payload[key] = null;
    });


    try {
      if (isEditing) { // isEditing implies isManaging is also true
        await updateInquiry(inquiryId, payload);
        setSuccess('Inquiry updated successfully!');
      } else {
        await submitInquiry(payload);
        setSuccess('Inquiry submitted successfully! We will get back to you soon.');
        // Reset form for new submission
        setFormData({
            subject: '', description: '', 
            inquirer_name: (currentUser && currentUser.role === USER_ROLES.PATIENT) ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : '',
            inquirer_email: (currentUser && currentUser.role === USER_ROLES.PATIENT) ? currentUser.email : '',
            inquirer_phone: '', 
            patient: (currentUser && currentUser.role === USER_ROLES.PATIENT) ? currentUser.id.toString() : '',
            source: INQUIRY_SOURCES.find(s => s.value === 'WEB_PORTAL')?.value || INQUIRY_SOURCES[0].value,
            status: 'OPEN', handled_by: (currentUser && isManaging) ? currentUser.id.toString() : '', resolution_notes: '',
        });
      }
      // Optionally navigate or call a success callback
      // if (onFormSubmitSuccess) onFormSubmitSuccess();
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'submit'} inquiry.`);
      console.error("Error submitting inquiry form:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputBaseClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900";
  const labelBaseClasses = "block text-sm font-medium text-gray-700 mb-1";
  const disabledInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-md shadow-sm sm:text-sm cursor-not-allowed";


  if (isLoading && ((isEditing && !formData.subject) || (!isEditing && isManaging && patients.length === 0))) {
    return <LoadingSpinner message={isEditing ? "Loading inquiry details..." : "Loading form..."} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl w-full">
      {/* Title is now expected to be handled by the parent page component */}
      {error && <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md text-sm">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label htmlFor="subject" className={labelBaseClasses}>Subject / Reason for Inquiry <span className="text-red-500">*</span></label>
              <input type="text" id="subject" name="subject" className={inputBaseClasses} value={formData.subject} onChange={handleChange} required disabled={isEditing && !isManaging}/>
          </div>
          <div>
              <label htmlFor="description" className={labelBaseClasses}>Detailed Description <span className="text-red-500">*</span></label>
              <textarea id="description" name="description" rows="4" className={inputBaseClasses} value={formData.description} onChange={handleChange} required disabled={isEditing && !isManaging}></textarea>
          </div>

          {/* Inquirer details - only editable if not a patient submitting for themselves OR if staff is managing */}
          {( (currentUser && currentUser.role !== USER_ROLES.PATIENT) || !currentUser || isManaging) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label htmlFor="inquirer_name" className={labelBaseClasses}>Your Name {(!currentUser || (currentUser.role !== USER_ROLES.PATIENT && !isManaging)) && <span className="text-red-500">*</span>}</label>
                  <input type="text" id="inquirer_name" name="inquirer_name" 
                         className={(currentUser?.role === USER_ROLES.PATIENT && !isManaging) ? disabledInputClasses : inputBaseClasses} 
                         value={formData.inquirer_name} onChange={handleChange} 
                         required={(!currentUser || (currentUser.role !== USER_ROLES.PATIENT && !isManaging))} 
                         disabled={(currentUser?.role === USER_ROLES.PATIENT && !isManaging) || (isEditing && !isManaging)} />
              </div>
              <div>
                  <label htmlFor="inquirer_email" className={labelBaseClasses}>Your Email</label>
                  <input type="email" id="inquirer_email" name="inquirer_email" 
                         className={(currentUser?.role === USER_ROLES.PATIENT && !isManaging) ? disabledInputClasses : inputBaseClasses} 
                         value={formData.inquirer_email} onChange={handleChange} 
                         disabled={(currentUser?.role === USER_ROLES.PATIENT && !isManaging) || (isEditing && !isManaging)} />
              </div>
            </div>
            <div>
                <label htmlFor="inquirer_phone" className={labelBaseClasses}>Your Phone Number</label>
                <input type="tel" id="inquirer_phone" name="inquirer_phone" className={inputBaseClasses} value={formData.inquirer_phone} onChange={handleChange} disabled={isEditing && !isManaging} />
            </div>
          </>
          )}
          
          {/* Staff-specific fields for managing/creating inquiries */}
          {isManaging && currentUser && (currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST || currentUser.role === USER_ROLES.NURSE) && (
          <>
              <hr className="my-4"/>
              <h4 className="text-md font-semibold text-gray-700 mb-3">Staff Management Section</h4>
              <div>
                  <label htmlFor="inq_patient_link" className={labelBaseClasses}>Link to Existing Patient (Optional)</label>
                  <select id="inq_patient_link" name="patient" className={inputBaseClasses} value={formData.patient} onChange={handleChange} disabled={patients.length === 0 || isLoading}>
                      <option value="">None</option>
                      {patients.map(p => (
                      <option key={p.user.id} value={p.user.id.toString()}>
                          {p.user.first_name} {p.user.last_name} (ID: {p.user.id})
                      </option>
                      ))}
                  </select>
              </div>
              <div>
                  <label htmlFor="inq_source" className={labelBaseClasses}>Source of Inquiry</label>
                  <select id="inq_source" name="source" className={inputBaseClasses} value={formData.source} onChange={handleChange}>
                      {INQUIRY_SOURCES.map(src => (<option key={src.value} value={src.value}>{src.label}</option>))}
                  </select>
              </div>
              <div>
                  <label htmlFor="inq_status" className={labelBaseClasses}>Status</label>
                  <select id="inq_status" name="status" className={inputBaseClasses} value={formData.status} onChange={handleChange}>
                      {INQUIRY_STATUS_CHOICES_STAFF.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
              </div>
              {/* <div> // Potentially add a dropdown for staff users if needed
                  <label htmlFor="inq_handled_by" className={labelBaseClasses}>Handled By (Staff)</label>
                  <select id="inq_handled_by" name="handled_by" className={inputBaseClasses} value={formData.handled_by} onChange={handleChange}>
                      <option value="">Unassigned</option>
                      {currentUser && <option value={currentUser.id.toString()}>Assign to Me ({currentUser.first_name})</option>}
                  </select>
              </div> */}
              <div>
                  <label htmlFor="resolution_notes" className={labelBaseClasses}>Resolution Notes</label>
                  <textarea id="resolution_notes" name="resolution_notes" rows="3" className={inputBaseClasses} value={formData.resolution_notes} onChange={handleChange}></textarea>
              </div>
          </>
          )}

        <div className="flex justify-end space-x-3 pt-4">
          {isEditing && (
            <button type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50" onClick={() => navigate(`/inquiries/${inquiryId}`)} disabled={isLoading}>
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : (isEditing ? 'Update Inquiry' : 'Submit Inquiry')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InquiryForm;
