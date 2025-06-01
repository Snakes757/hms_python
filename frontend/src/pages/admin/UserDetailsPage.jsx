// src/pages/admin/UserDetailsPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import UserDetailsEdit from '../../components/admin/UserDetailsEdit'; // Renamed component
import Sidebar from '../../components/common/Sidebar';

const UserDetailsPage = () => {
  const { userId } = useParams(); // Get userId from URL

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4 flex-grow-1">
        <UserDetailsEdit userIdParam={userId} />
      </div>
    </div>
  );
};

export default UserDetailsPage;
