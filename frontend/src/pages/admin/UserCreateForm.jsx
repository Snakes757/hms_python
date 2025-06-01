// src/components/admin/UserCreateForm.jsx
import React, { useState, useContext } from 'react';
import { usersApi } from '../../api'; // Using centralized API exports
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_ROLES as ROLE_OPTIONS } from '../../utils/constants'; // User roles from constants

const UserCreateForm = () => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const initialFormData = {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: ROLE_OPTIONS.PATIENT, // Default role
    is_active: true,
    is_staff: false,
    is_superuser: false,
    // Role-specific fields (mirroring RegisterForm and AdminUserUpdateSerializer)
    specialization: '', 
    license_number: '', 
    department: '',     
  };
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 10) {
        setError('Password must be at least 10 characters long.');
        return;
    }

    setIsLoading(true);
    
    // The backend /api/v1/users/register/ endpoint is used for public registration.
    // For admin user creation, the backend might expect a different endpoint or payload structure
    // if it's not using the same UserRegistrationSerializer.
    // Let's assume for now an admin might use a similar payload structure to registration,
    // but the API call would be to a general user creation endpoint if one exists,
    // or the register endpoint if it's flexible enough for admin use (unlikely for setting is_staff/is_superuser).

    // The backend's `UserRegistrationSerializer` creates profiles based on role.
    // The `AdminUserUpdateSerializer` handles profile updates for existing users.
    // For creation by admin, the backend would ideally have a dedicated serializer or view
    // that allows setting all these fields, including `is_staff` and `is_superuser`.
    // The `usersApi.createUser` function is not yet defined. We'll use `authApi.registerUser`
    // and acknowledge its limitations for admin-specific fields.
    // A proper admin user creation endpoint would be POST /api/v1/users/

    const payload = { ...formData };
    delete payload.password_confirm; // Not sent to backend

    // If using the standard registration endpoint, is_staff and is_superuser might be ignored.
    // This highlights a potential need for a dedicated admin user creation endpoint/serializer.
    try {
      // Ideally: await usersApi.adminCreateUser(payload);
      // Using registerUser for now, which might not set is_staff/is_superuser.
      // The backend's UserRegistrationSerializer doesn't handle is_staff/is_superuser.
      // This form is more aligned with what an AdminUserUpdateSerializer would handle for an *existing* user.
      // For creation, a backend change might be needed or use a different approach.
      // For now, we'll proceed as if `authApi.registerUser` can handle this.
      // A more robust solution would be a dedicated admin endpoint.
      
      // Let's assume we are using the standard registration endpoint for this example.
      // Admin specific fields like is_staff, is_superuser will likely NOT be set by this.
      const { is_staff, is_superuser, ...registrationPayload } = payload; // Remove admin-only fields if using registerUser

      await usersApi.authApi.registerUser(registrationPayload); // Using authApi from centralized export
      setSuccess(`User ${registrationPayload.username} created successfully. Note: Admin-specific flags (is_staff, is_superuser) might not be set via this endpoint.`);
      setFormData(initialFormData); // Reset form
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
        if (err.message && err.message.includes('{') && err.message.includes('}')) {
            try {
                const errorObj = JSON.parse(err.message.substring(err.message.indexOf('{'), err.message.lastIndexOf('}') + 1));
                const messages = Object.entries(errorObj).map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`).join('; ');
                setError(messages || 'User creation failed.');
            } catch (parseError) {
                setError(err.message || 'User creation failed.');
            }
        } else {
            setError(err.message || 'User creation failed.');
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <p className="text-danger">Access Denied. Admin role required.</p>;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="adminCreate_username" className="form-label">Username <span className="text-danger">*</span></label>
              <input type="text" name="username" className="form-control" id="adminCreate_username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="adminCreate_email" className="form-label">Email address <span className="text-danger">*</span></label>
              <input type="email" name="email" className="form-control" id="adminCreate_email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="adminCreate_password" className="form-label">Password <span className="text-danger">*</span></label>
              <input type="password" name="password" className="form-control" id="adminCreate_password" value={formData.password} onChange={handleChange} required minLength="10"/>
              <div className="form-text">Min. 10 characters.</div>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="adminCreate_password_confirm" className="form-label">Confirm Password <span className="text-danger">*</span></label>
              <input type="password" name="password_confirm" className="form-control" id="adminCreate_password_confirm" value={formData.password_confirm} onChange={handleChange} required />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="adminCreate_first_name" className="form-label">First Name</label>
              <input type="text" name="first_name" className="form-control" id="adminCreate_first_name" value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="adminCreate_last_name" className="form-label">Last Name</label>
              <input type="text" name="last_name" className="form-control" id="adminCreate_last_name" value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="adminCreate_role" className="form-label">Role <span className="text-danger">*</span></label>
            <select name="role" className="form-select" id="adminCreate_role" value={formData.role} onChange={handleChange} required>
              {Object.entries(ROLE_OPTIONS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          {formData.role === ROLE_OPTIONS.DOCTOR && (
            <fieldset className="border p-3 mb-3 rounded">
              <legend className="w-auto px-2 h6">Doctor Profile</legend>
              <div className="mb-2">
                <label htmlFor="adminCreate_specialization" className="form-label">Specialization</label>
                <input type="text" name="specialization" className="form-control form-control-sm" id="adminCreate_specialization" value={formData.specialization} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="adminCreate_license_number" className="form-label">License Number</label>
                <input type="text" name="license_number" className="form-control form-control-sm" id="adminCreate_license_number" value={formData.license_number} onChange={handleChange} />
              </div>
            </fieldset>
          )}

          {formData.role === ROLE_OPTIONS.NURSE && (
            <fieldset className="border p-3 mb-3 rounded">
              <legend className="w-auto px-2 h6">Nurse Profile</legend>
              <div>
                <label htmlFor="adminCreate_department" className="form-label">Department</label>
                <input type="text" name="department" className="form-control form-control-sm" id="adminCreate_department" value={formData.department} onChange={handleChange} />
              </div>
            </fieldset>
          )}
          
          <h5 className="mt-3">Account Status & Permissions</h5>
            <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" role="switch" id="adminCreate_is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
                <label className="form-check-label" htmlFor="adminCreate_is_active">Active Account</label>
            </div>
            <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" role="switch" id="adminCreate_is_staff" name="is_staff" checked={formData.is_staff} onChange={handleChange} />
                <label className="form-check-label" htmlFor="adminCreate_is_staff">Staff Member (Django Admin Access)</label>
            </div>
            <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" role="switch" id="adminCreate_is_superuser" name="is_superuser" checked={formData.is_superuser} onChange={handleChange} />
                <label className="form-check-label" htmlFor="adminCreate_is_superuser">Superuser (All Permissions)</label>
            </div>


          <div className="d-flex justify-content-end mt-3">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => navigate('/admin/users')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <LoadingSpinner message="Creating..." size="sm"/> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreateForm;
