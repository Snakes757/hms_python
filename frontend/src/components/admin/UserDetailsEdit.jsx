// src/components/admin/UserDetailsEdit.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserById, updateUserById } from '../../api/users';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import UserEditForm from './UserEditForm'; // The form for editing

const UserDetailsEdit = ({ userIdParam }) => {
  const { userId: routeUserId } = useParams();
  const userId = userIdParam || routeUserId;

  const [userToManage, setUserToManage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchUserToManage = async () => {
    if (!userId) {
      setError("User ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await getUserById(userId);
      setUserToManage(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch user details.');
      console.error("Error fetching user for admin view:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      fetchUserToManage();
    } else {
      setError("Access Denied. Admin role required.");
      setIsLoading(false);
    }
  }, [userId, currentUser]);

  const handleUpdateSuccess = (updatedUserData) => {
    setUserToManage(updatedUserData); // Update local state with new data from form
    setSuccess('User profile updated successfully by admin!');
    // Optionally navigate or just show success message
    // navigate('/admin/users'); 
  };


  if (isLoading && !userToManage) {
    return <LoadingSpinner message="Loading user details..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
     return <div className="alert alert-danger mt-3" role="alert">Access Denied. Admin role required.</div>;
  }

  if (!userToManage) {
    return <div className="alert alert-warning mt-3">User not found.</div>;
  }

  return (
    <div className="container mt-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Manage User: {userToManage.first_name} {userToManage.last_name} (ID: {userToManage.id})</h2>
        <Link to="/admin/users" className="btn btn-outline-secondary btn-sm">Back to User List</Link>
      </div>
      {success && <div className="alert alert-success">{success}</div>}
      
      {/* Embed the UserEditForm here */}
      <UserEditForm 
        userToEdit={userToManage} 
        onUpdateSuccess={handleUpdateSuccess} 
      />

      {/* Display other non-editable info or related data if needed */}
      <div className="card mt-4">
        <div className="card-header">
            <h5>Additional Information</h5>
        </div>
        <div className="card-body">
            <p><strong>Email:</strong> {userToManage.email}</p>
            <p><strong>Username:</strong> {userToManage.username}</p>
            <p><strong>Role:</strong> {userToManage.role_display || userToManage.role}</p>
            <p><strong>Status:</strong> {userToManage.is_active ? 'Active' : 'Inactive'}</p>
            <p><strong>Date Joined:</strong> {new Date(userToManage.date_joined).toLocaleString()}</p>
            <p><strong>Last Login:</strong> {userToManage.last_login ? new Date(userToManage.last_login).toLocaleString() : 'Never'}</p>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsEdit;
