// src/components/admin/UserEditForm.jsx
import React, { useState, useEffect } from 'react';
import { updateUserById } from '../../api/users';
import LoadingSpinner from '../common/LoadingSpinner';

const USER_ROLES = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'NURSE', label: 'Nurse' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'ADMIN', label: 'Admin' },
];

const UserEditForm = ({ userToEdit, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    role: '',
    is_active: true,
    is_staff: false, // Admins can control this
    is_superuser: false, // Admins can control this
    // Profile fields
    doctor_profile: { specialization: '', license_number: '' },
    nurse_profile: { department: '' },
    // Receptionist and Admin profiles are placeholders in backend, no specific fields yet
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        email: userToEdit.email || '',
        username: userToEdit.username || '',
        first_name: userToEdit.first_name || '',
        last_name: userToEdit.last_name || '',
        role: userToEdit.role || '',
        is_active: userToEdit.is_active === undefined ? true : userToEdit.is_active,
        is_staff: userToEdit.is_staff || false,
        is_superuser: userToEdit.is_superuser || false,
        doctor_profile: userToEdit.profile && userToEdit.role === 'DOCTOR' ? 
                        { specialization: userToEdit.profile.specialization || '', license_number: userToEdit.profile.license_number || '' } : 
                        { specialization: '', license_number: '' },
        nurse_profile: userToEdit.profile && userToEdit.role === 'NURSE' ? 
                       { department: userToEdit.profile.department || '' } : 
                       { department: '' },
      });
    }
  }, [userToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("doctor_profile.") || name.startsWith("nurse_profile.")) {
        const [profileType, fieldName] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [profileType]: {
                ...prev[profileType],
                [fieldName]: value
            }
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Prepare payload based on AdminUserUpdateSerializer structure
    const payload = {
      email: formData.email,
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      is_active: formData.is_active,
      is_staff: formData.is_staff,
      is_superuser: formData.is_superuser,
    };

    if (formData.role === 'DOCTOR') {
      payload.doctor_profile = formData.doctor_profile;
    } else {
        payload.doctor_profile = null; // Or ensure backend handles removing if role changes
    }
    if (formData.role === 'NURSE') {
      payload.nurse_profile = formData.nurse_profile;
    } else {
        payload.nurse_profile = null;
    }
    // Add receptionist_profile and admin_profile if they get specific fields

    try {
      const updatedUser = await updateUserById(userToEdit.id, payload);
      onUpdateSuccess(updatedUser); // Pass updated data to parent
    } catch (err) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userToEdit) return <LoadingSpinner />;

  return (
    <div className="card shadow-sm">
        <div className="card-header">
            <h5 className="mb-0">Edit User Details</h5>
        </div>
        <div className="card-body">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="adminEdit_email" className="form-label">Email <span className="text-danger">*</span></label>
                        <input type="email" className="form-control" id="adminEdit_email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="adminEdit_username" className="form-label">Username <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="adminEdit_username" name="username" value={formData.username} onChange={handleChange} required />
                    </div>
                </div>
                 <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="adminEdit_first_name" className="form-label">First Name</label>
                        <input type="text" className="form-control" id="adminEdit_first_name" name="first_name" value={formData.first_name} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="adminEdit_last_name" className="form-label">Last Name</label>
                        <input type="text" className="form-control" id="adminEdit_last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
                    </div>
                </div>
                <div className="mb-3">
                    <label htmlFor="adminEdit_role" className="form-label">Role <span className="text-danger">*</span></label>
                    <select className="form-select" id="adminEdit_role" name="role" value={formData.role} onChange={handleChange} required>
                        {USER_ROLES.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                </div>

                {/* Role-Specific Profile Fields */}
                {formData.role === 'DOCTOR' && (
                    <fieldset className="border p-3 mb-3 rounded">
                        <legend className="w-auto px-2 h6">Doctor Profile</legend>
                        <div className="mb-3">
                            <label htmlFor="adminEdit_doc_specialization" className="form-label">Specialization</label>
                            <input type="text" className="form-control" id="adminEdit_doc_specialization" name="doctor_profile.specialization" value={formData.doctor_profile.specialization} onChange={handleChange} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="adminEdit_doc_license" className="form-label">License Number</label>
                            <input type="text" className="form-control" id="adminEdit_doc_license" name="doctor_profile.license_number" value={formData.doctor_profile.license_number} onChange={handleChange} />
                        </div>
                    </fieldset>
                )}
                {formData.role === 'NURSE' && (
                     <fieldset className="border p-3 mb-3 rounded">
                        <legend className="w-auto px-2 h6">Nurse Profile</legend>
                        <div className="mb-3">
                            <label htmlFor="adminEdit_nurse_department" className="form-label">Department</label>
                            <input type="text" className="form-control" id="adminEdit_nurse_department" name="nurse_profile.department" value={formData.nurse_profile.department} onChange={handleChange} />
                        </div>
                    </fieldset>
                )}

                <h5 className="mt-3">Permissions & Status</h5>
                <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" role="switch" id="adminEdit_is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="adminEdit_is_active">Active Account</label>
                </div>
                 <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" role="switch" id="adminEdit_is_staff" name="is_staff" checked={formData.is_staff} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="adminEdit_is_staff">Staff Member (Access to Admin Interface)</label>
                </div>
                 <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" role="switch" id="adminEdit_is_superuser" name="is_superuser" checked={formData.is_superuser} onChange={handleChange} />
                    <label className="form-check-label" htmlFor="adminEdit_is_superuser">Superuser (All Permissions)</label>
                </div>
                
                <div className="d-flex justify-content-end mt-3">
                    {/* <button type="button" className="btn btn-outline-secondary me-2" onClick={onCancel}>Cancel</button> */}
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save User Changes'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default UserEditForm;
