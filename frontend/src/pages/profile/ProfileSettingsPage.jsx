// src/pages/profile/ProfileSettingsPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/common/Sidebar';
// import { changePassword } from '../../api/auth'; // Placeholder for API call

const ProfileSettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 10) { // Consistent with registration validation
        setError("New password must be at least 10 characters long.");
        return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call for changing password
      // await changePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password changed successfully! (API call not implemented yet)');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div className="container-fluid mt-4 flex-grow-1">
          <p className="text-danger">You need to be logged in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <h1>Profile Settings</h1>
        <p>Manage your account settings.</p>
        <hr />

        <div className="row">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">Change Password</h5>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <form onSubmit={handlePasswordChangeSubmit}>
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="currentPassword" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="newPassword" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                      minLength="10"
                    />
                     <div className="form-text">
                        Must be at least 10 characters long.
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      id="confirmPassword" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            {/* Placeholder for other settings, e.g., notification preferences, theme */}
            <div className="card shadow-sm">
              <div className="card-header">
                <h5 className="mb-0">Preferences (Placeholder)</h5>
              </div>
              <div className="card-body">
                <p className="text-muted"><em>(Notification settings, theme preferences, etc., will appear here.)</em></p>
                {/* Example:
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" role="switch" id="emailNotifications" />
                  <label className="form-check-label" htmlFor="emailNotifications">Receive Email Notifications</label>
                </div> 
                */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
