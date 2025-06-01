// src/pages/profile/UserProfilePage.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateUserProfile, getUserProfile } from '../../api/auth'; // Assuming updateUserProfile is in auth.js

const UserProfilePage = () => {
  const { user, setUser, token, loading: authLoading } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // The user object from AuthContext might already be detailed enough.
      // If not, or to ensure fresh data, fetch profile explicitly.
      // For now, we'll use the user from context and allow fetching if needed.
      
      // The backend /api/v1/users/profile/ endpoint returns the CustomUser fields
      // and also the nested role-specific profile (e.g., doctor_profile, patient_profile).
      // The CustomUserSerializer in backend already includes a 'profile' SerializerMethodField.
      // Let's assume 'user' from AuthContext contains this structure.

      const initialData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        // Role-specific fields - these depend on the structure of `user.profile`
        // This needs to be dynamic based on user.role
      };

      if (user.role === 'DOCTOR' && user.profile) {
        initialData.specialization = user.profile.specialization || '';
        initialData.license_number = user.profile.license_number || '';
      } else if (user.role === 'NURSE' && user.profile) {
        initialData.department = user.profile.department || '';
      } else if (user.role === 'PATIENT' && user.profile) { // Patient profile is directly on Patient model
        // The 'user.profile' for a patient might be structured differently or might be part of the main 'user' object
        // from AuthContext if it's fetched from /api/v1/users/profile/ which includes Patient data.
        // Let's assume the backend /api/v1/users/profile/ for a PATIENT user returns patient-specific fields directly
        // or nested under a 'patient_profile' key that matches the Patient model.
        // The `CustomUserSerializer` in `users/serializers.py` has a `get_profile` method.
        // For a PATIENT, this `get_profile` method in the backend currently returns None.
        // The patient-specific data (DOB, gender, address etc.) is part of the Patient model,
        // which is linked OneToOne to CustomUser.
        // The `/api/v1/users/profile/` endpoint, when accessed by an authenticated user,
        // should ideally return these patient-specific fields if the user is a PATIENT.
        // Let's assume the backend's CustomUserSerializer for a patient includes these fields directly or under `patient_profile`.
        // For now, we'll refer to `user.patient_profile` if it exists, or directly to `user` fields.
        const patientProfileSource = user.patient_profile || user; // Adjust based on actual API response for patients
        initialData.date_of_birth = patientProfileSource.date_of_birth || '';
        initialData.gender = patientProfileSource.gender || '';
        initialData.address = patientProfileSource.address || '';
        initialData.phone_number = patientProfileSource.phone_number || '';
        initialData.emergency_contact_name = patientProfileSource.emergency_contact_name || '';
        initialData.emergency_contact_phone = patientProfileSource.emergency_contact_phone || '';
      }
      setProfileData(initialData);
    } else if (!authLoading && !user && token) {
        // Token exists but user is not set in context yet (e.g. after a refresh and context is re-initializing)
        // Try to fetch profile again. AuthContext also does this, but this is a fallback.
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const fetchedUser = await getUserProfile(); // from api/auth.js
                setUser(fetchedUser); // Update context
                // Now setProfileData based on fetchedUser (logic similar to above)
                 const initialData = {
                    first_name: fetchedUser.first_name || '',
                    last_name: fetchedUser.last_name || '',
                    username: fetchedUser.username || '',
                };
                if (fetchedUser.role === 'DOCTOR' && fetchedUser.profile) {
                    initialData.specialization = fetchedUser.profile.specialization || '';
                    initialData.license_number = fetchedUser.profile.license_number || '';
                } // ... add other roles
                setProfileData(initialData);
            } catch (err) {
                setError("Could not load profile data.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }


  }, [user, authLoading, token, setUser]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Prepare data for API: only send fields that are part of UserProfileUpdateSerializer
    const updatePayload = {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      username: profileData.username,
    };

    if (user.role === 'DOCTOR') {
      updatePayload.doctor_profile = {
        specialization: profileData.specialization,
        license_number: profileData.license_number,
      };
    } else if (user.role === 'NURSE') {
      updatePayload.nurse_profile = {
        department: profileData.department,
      };
    } else if (user.role === 'PATIENT') {
        // Patient specific fields are updated via PATCH /api/v1/patients/<user__id>/
        // The /api/v1/users/profile/ PUT might only handle CustomUser fields and linked role profiles
        // like DoctorProfile, NurseProfile. For Patient, it's different.
        // UserProfileUpdateSerializer in backend only handles first_name, last_name, username, doctor_profile, nurse_profile.
        // So, for a patient, we might need a different endpoint or the backend UserProfileUpdateSerializer needs adjustment.
        // For now, this example will only update basic user fields for a patient via this form.
        // A separate "Edit Patient Demographics" form would use the patients API.
        // Let's assume for now that the UserProfileUpdateSerializer on the backend
        // can handle patient-specific fields if they are sent, or they are ignored.
        // This part needs clarification based on backend capabilities of PUT /api/v1/users/profile/ for patients.
        // Based on `UserProfileUpdateSerializer` in `users/serializers.py`, it does NOT handle patient-specific fields.
        // It handles `doctor_profile` and `nurse_profile`.
        // So, for PATIENT, only first_name, last_name, username can be updated here.
    }


    try {
      const updatedUser = await updateUserProfile(updatePayload); // from api/auth.js
      setUser(updatedUser); // Update user in AuthContext
      localStorage.setItem('userData', JSON.stringify(updatedUser)); // Update localStorage
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading || !profileData) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="container mt-5"><p className="text-danger">User not found. Please log in.</p></div>;
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="card-title mb-0">My Profile</h2>
                {!editMode && (
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="emailDisplay" className="form-label">Email</label>
                  <input type="email" id="emailDisplay" className="form-control" value={user.email} disabled readOnly />
                </div>
                <div className="mb-3">
                  <label htmlFor="roleDisplay" className="form-label">Role</label>
                  <input type="text" id="roleDisplay" className="form-control" value={user.role_display || user.role} disabled readOnly />
                </div>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input type="text" name="username" id="username" className="form-control" value={profileData.username} onChange={handleChange} disabled={!editMode} />
                </div>
                <div className="mb-3">
                  <label htmlFor="first_name" className="form-label">First Name</label>
                  <input type="text" name="first_name" id="first_name" className="form-control" value={profileData.first_name} onChange={handleChange} disabled={!editMode} />
                </div>
                <div className="mb-3">
                  <label htmlFor="last_name" className="form-label">Last Name</label>
                  <input type="text" name="last_name" id="last_name" className="form-control" value={profileData.last_name} onChange={handleChange} disabled={!editMode} />
                </div>

                {/* Role-Specific Fields */}
                {user.role === 'DOCTOR' && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="specialization" className="form-label">Specialization</label>
                      <input type="text" name="specialization" id="specialization" className="form-control" value={profileData.specialization || ''} onChange={handleChange} disabled={!editMode} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="license_number" className="form-label">License Number</label>
                      <input type="text" name="license_number" id="license_number" className="form-control" value={profileData.license_number || ''} onChange={handleChange} disabled={!editMode} />
                    </div>
                  </>
                )}

                {user.role === 'NURSE' && (
                  <div className="mb-3">
                    <label htmlFor="department" className="form-label">Department</label>
                    <input type="text" name="department" id="department" className="form-control" value={profileData.department || ''} onChange={handleChange} disabled={!editMode} />
                  </div>
                )}
                
                {/* Patient specific fields are typically managed via /api/v1/patients/<user_id>/ endpoint */}
                {/* This form currently only updates CustomUser and Doctor/Nurse profiles via /api/v1/users/profile/ */}
                {user.role === 'PATIENT' && (
                  <>
                    <p className="text-muted small">To update address, phone, or emergency contacts, please visit the dedicated patient information section (to be implemented).</p>
                    <div className="mb-3">
                      <label htmlFor="date_of_birth" className="form-label">Date of Birth</label>
                      <input type="date" name="date_of_birth" id="date_of_birth" className="form-control" value={profileData.date_of_birth || ''} onChange={handleChange} disabled={true} />
                    </div>
                     <div className="mb-3">
                      <label htmlFor="gender" className="form-label">Gender</label>
                      <input type="text" name="gender" id="gender" className="form-control" value={profileData.gender || ''} onChange={handleChange} disabled={true} />
                    </div>
                    {/* Add other read-only patient fields if desired */}
                  </>
                )}


                {editMode && (
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={() => { setEditMode(false); setError(''); setSuccess(''); /* Reset form to original user data */ setProfileData(user); }}>
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
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
