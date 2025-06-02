import React, { useState, useEffect, useContext } from 'react';
import { listAllUsers, updateUserById, deleteUserById } from '../../api/users';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'; // Example icons

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', is_active: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);


  const fetchUsers = async () => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      setError("Access Denied. Admin role required.");
      setUsers([]);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Pass actual filters and debounced search term to API if supported
      // For now, client-side filtering as per original logic
      const data = await listAllUsers(); // Ideally, API would handle filtering: listAllUsers({ role: filters.role, is_active: filters.is_active, search: debouncedSearchTerm })
      let filteredData = data.results || data || [];

      // Apply client-side filtering
      if (filters.role) {
        filteredData = filteredData.filter(u => u.role === filters.role);
      }
      if (filters.is_active !== '') {
        filteredData = filteredData.filter(u => u.is_active === (filters.is_active === 'true'));
      }
      if (debouncedSearchTerm) { // Use debounced term for filtering
        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        filteredData = filteredData.filter(u =>
            (u.email && u.email.toLowerCase().includes(lowerSearchTerm)) ||
            (u.username && u.username.toLowerCase().includes(lowerSearchTerm)) ||
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

  // Effect for applying filters and debounced search
   useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser, filters, debouncedSearchTerm]); // Re-fetch when filters or debouncedSearchTerm change


  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // The applyAllFilters button might not be strictly necessary if useEffect handles changes,
  // but can be kept for explicit user action if desired.
  const applyAllFilters = () => {
    fetchUsers(); // This will use the current state of filters and debouncedSearchTerm
  };

  const toggleUserActiveStatus = async (userId, currentStatus) => {
    // Consider replacing window.confirm with a custom modal for better UX
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      setIsLoading(true); // Consider a more granular loading state for row actions
      try {
        await updateUserById(userId, { is_active: !currentStatus });
        fetchUsers(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to update user status.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        setIsLoading(true); // Granular loading state
        try {
            await deleteUserById(userId);
            fetchUsers(); // Refresh the list
        } catch (err) {
            setError(err.message || 'Failed to delete user.');
        } finally {
            setIsLoading(false);
        }
    }
  };

  // Initial loading state for the whole component
  if (isLoading && users.length === 0 && !error) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message="Loading users..." /></div>;
  }

  if (error && users.length === 0) { // Show error prominently if initial load fails
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>;
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">Access Denied. Admin role required.</div>;
  }

  // Common Tailwind classes for form elements
  const inputBaseClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-900";
  const labelBaseClasses = "block text-sm font-medium text-gray-700";

  return (
    <div className="mt-0 space-y-6">
      {/* Filter and Search Section - Tailwind Styled */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Filter & Search Users</h2>
        {error && !isLoading && <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm" role="alert">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
                <label htmlFor="searchTerm" className={labelBaseClasses}>Search</label>
                <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      id="searchTerm"
                      className={`${inputBaseClasses} pl-10`}
                      placeholder="Name, email, username..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                </div>
            </div>
            <div>
                <label htmlFor="roleFilter" className={labelBaseClasses}>Role</label>
                <select
                  id="roleFilter"
                  name="role"
                  className={inputBaseClasses}
                  value={filters.role}
                  onChange={handleFilterChange}
                >
                    <option value="">All Roles</option>
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>
            <div>
                <label htmlFor="statusFilter" className={labelBaseClasses}>Status</label>
                 <select
                   id="statusFilter"
                   name="is_active"
                   className={inputBaseClasses}
                   value={filters.is_active}
                   onChange={handleFilterChange}
                 >
                    <option value="">Any Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>
            <div>
                {/* This button might be less necessary with auto-filtering on change via useEffect */}
                <button
                  type="button" // Changed to type="button" if form submission is not the primary action
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                  onClick={applyAllFilters} // Explicitly call applyAllFilters
                  disabled={isLoading}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" aria-hidden="true"/>
                  Apply Filters
                </button>
            </div>
        </div>
      </div>

      {/* User Table */}
      {isLoading && users.length > 0 && <div className="flex justify-center py-4"><LoadingSpinner message="Updating list..." /></div>}
      
      {!isLoading && users.length === 0 && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md">No users found matching your criteria.</div>
      )}

      {users.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.first_name} {user.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'NURSE' ? 'bg-green-100 text-green-800' :
                        user.role === 'RECEPTIONIST' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800' // Patient or other
                    }`}>
                        {user.role_display || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.date_joined).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View/Edit
                    </Link>
                    <button
                      onClick={() => toggleUserActiveStatus(user.id, user.is_active)}
                      disabled={isLoading || user.id === currentUser.id}
                      className={`font-medium ${user.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                     {user.id !== currentUser.id && (
                        <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
