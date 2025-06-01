// src/components/admin/UserList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { listAllUsers, updateUserById, deleteUserById } from '../../api/users'; // Assuming updateUserById can toggle is_active
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', is_active: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      setError("Access Denied. Admin role required.");
      setUsers([]);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // TODO: Implement backend filtering for listAllUsers if API supports it
      // For now, fetching all and filtering client-side (not ideal for large datasets)
      const data = await listAllUsers(); 
      let filteredData = data.results || data || [];

      if (filters.role) {
        filteredData = filteredData.filter(u => u.role === filters.role);
      }
      if (filters.is_active !== '') {
        filteredData = filteredData.filter(u => u.is_active === (filters.is_active === 'true'));
      }
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = filteredData.filter(u => 
            u.email.toLowerCase().includes(lowerSearchTerm) ||
            u.username.toLowerCase().includes(lowerSearchTerm) ||
            (u.first_name && u.first_name.toLowerCase().includes(lowerSearchTerm)) ||
            (u.last_name && u.last_name.toLowerCase().includes(lowerSearchTerm))
        );
      }
      setUsers(filteredData);
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]); // Initial fetch

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const applyAllFilters = () => {
    fetchUsers(); // Re-fetch and apply filters
  };

  const toggleUserActiveStatus = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      setIsLoading(true);
      try {
        await updateUserById(userId, { is_active: !currentStatus });
        fetchUsers(); // Refresh list
      } catch (err) {
        setError(err.message || 'Failed to update user status.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        setIsLoading(true);
        try {
            await deleteUserById(userId);
            fetchUsers(); // Refresh list
        } catch (err) {
            setError(err.message || 'Failed to delete user.');
        } finally {
            setIsLoading(false);
        }
    }
  };


  if (isLoading && users.length === 0) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (error) {
    return <div className="alert alert-danger mt-3" role="alert">{error}</div>;
  }
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div className="alert alert-warning mt-3">Access Denied. Admin role required.</div>;
  }

  return (
    <div className="mt-0">
      <div className="card shadow-sm mb-3">
        <div className="card-body">
            <h5 className="card-title">Filter & Search Users</h5>
            <div className="row g-2">
                <div className="col-md-3">
                    <input type="text" className="form-control form-control-sm" placeholder="Search name, email, username..." value={searchTerm} onChange={handleSearchChange} />
                </div>
                <div className="col-md-3">
                    <select name="role" className="form-select form-select-sm" value={filters.role} onChange={handleFilterChange}>
                        <option value="">All Roles</option>
                        <option value="PATIENT">Patient</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="NURSE">Nurse</option>
                        <option value="RECEPTIONIST">Receptionist</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                <div className="col-md-3">
                     <select name="is_active" className="form-select form-select-sm" value={filters.is_active} onChange={handleFilterChange}>
                        <option value="">Any Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <button className="btn btn-primary btn-sm w-100" onClick={applyAllFilters}>Apply</button>
                </div>
            </div>
        </div>
      </div>


      {users.length === 0 && !isLoading && <div className="alert alert-info">No users found matching your criteria.</div>}
      
      {users.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.username}</td>
                  <td>{user.first_name} {user.last_name}</td>
                  <td><span className={`badge bg-info text-dark`}>{user.role_display || user.role}</span></td>
                  <td>
                    <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/admin/users/${user.id}`} className="btn btn-sm btn-outline-primary me-2 mb-1">
                      View/Edit
                    </Link>
                    <button 
                      className={`btn btn-sm btn-outline-${user.is_active ? 'warning' : 'success'} me-2 mb-1`}
                      onClick={() => toggleUserActiveStatus(user.id, user.is_active)}
                      disabled={isLoading || user.id === currentUser.id} // Prevent deactivating self
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                     {user.id !== currentUser.id && ( // Prevent deleting self
                        <button 
                            className="btn btn-sm btn-outline-danger mb-1"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                        >
                            Delete
                        </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList;
