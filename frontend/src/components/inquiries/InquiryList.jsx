// src/components/inquiries/InquiryList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listInquiries, deleteInquiry } from '../../api/inquiries'; // API functions
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const INQUIRY_STATUS_CLASSES = {
  OPEN: 'primary',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'secondary',
  PENDING_PATIENT: 'warning',
  ON_HOLD: 'light text-dark border',
};

const InquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchInquiries = async () => {
    if (!currentUser) { // For now, assume listing requires login, adjust if public view needed
        setError("Please log in to view inquiries.");
        setInquiries([]);
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      let params = {};
      if (currentUser.role === 'PATIENT') {
        params.patient__user__id = currentUser.id; // Backend should filter by patient if submitted by them
                                               // Or by inquirer_email if they submitted while not logged in
                                               // This needs careful backend query design.
                                               // For simplicity, we assume backend handles this if patient_id is sent.
                                               // Or, if inquiry has a direct `user` link for authenticated submitters.
      }
      // Staff (Admin, Receptionist, Nurse) see a broader list. Backend handles role-based filtering.
      const data = await listInquiries(params);
      setInquiries(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inquiries.');
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [currentUser]); // Re-fetch if user changes

  const handleDelete = async (inquiryId) => {
    // Backend's deleteInquiry handles soft delete (closing) for staff and hard delete for admin.
    const actionText = currentUser?.role === 'ADMIN' ? 'permanently delete' : 'close';
    if (window.confirm(`Are you sure you want to ${actionText} this inquiry?`)) {
      setIsLoading(true); // Consider a specific loading state for delete
      try {
        await deleteInquiry(inquiryId);
        fetchInquiries(); // Refresh list
      } catch (err) {
        setError(err.message || `Failed to ${actionText} inquiry.`);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (isLoading && inquiries.length === 0) {
    return <LoadingSpinner message="Loading inquiries..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }
  
  if (!currentUser && inquiries.length === 0) { // Adjust if public view is intended
    return <div className="alert alert-info mt-3">No inquiries to display. Public users can submit new inquiries.</div>;
  }
  
  if (currentUser && inquiries.length === 0) {
    return <div className="alert alert-info mt-3">No inquiries found.</div>;
  }


  const canManageInquiry = (inquiry) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST' || currentUser.role === 'NURSE';
  };

  return (
    <div className="mt-0">
      <h4 className="mb-3">Inquiries</h4>
      <div className="list-group">
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} className="list-group-item list-group-item-action flex-column align-items-start mb-2 shadow-sm">
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1">{inquiry.subject}</h5>
              <small className="text-muted">
                Submitted: {new Date(inquiry.created_at).toLocaleDateString()}
              </small>
            </div>
            <p className="mb-1">
              <strong>Inquirer:</strong> {inquiry.inquirer_name} 
              {inquiry.inquirer_email && ` (${inquiry.inquirer_email})`}
              {inquiry.patient_details && ` (Patient: ${inquiry.patient_details.user.first_name} ${inquiry.patient_details.user.last_name})`}
            </p>
            <p className="mb-1">
                <strong>Status:</strong> <span className={`badge bg-${INQUIRY_STATUS_CLASSES[inquiry.status] || 'light text-dark'}`}>{inquiry.status_display || inquiry.status}</span>
            </p>
            <p className="mb-1 text-truncate" style={{maxWidth: '80%'}}><strong>Description:</strong> {inquiry.description}</p>
            <small className="text-muted">
              Source: {inquiry.source_display || inquiry.source}
              {inquiry.handled_by_details && ` | Handled by: ${inquiry.handled_by_details.first_name} ${inquiry.handled_by_details.last_name}`}
            </small>
            <div className="mt-2 text-end">
              <Link to={`/inquiries/${inquiry.id}`} className="btn btn-sm btn-outline-primary me-2">
                View Details
              </Link>
              {canManageInquiry(inquiry) && (
                <button 
                  className={`btn btn-sm btn-outline-${currentUser.role === 'ADMIN' ? 'danger' : 'warning'}`}
                  onClick={() => handleDelete(inquiry.id)}
                  disabled={isLoading}
                >
                  {currentUser.role === 'ADMIN' ? 'Delete' : 'Close'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InquiryList;
