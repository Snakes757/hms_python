// src/pages/admin/UserListPage.jsx
import React from 'react';
import UserList from '../../components/admin/UserList';
import Sidebar from '../../components/common/Sidebar';
import { Link } from 'react-router-dom'; // For "Add User" button if needed, though registration is primary

const UserListPage = () => {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>User Management</h1>
          {/* Admin might have a specific "Create User" form different from public registration */}
          {/* <Link to="/admin/users/new" className="btn btn-primary">Add New User</Link> */}
        </div>
        <UserList />
      </div>
    </div>
  );
};

export default UserListPage;
