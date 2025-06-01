// src/pages/admin/UserCreatePage.jsx
import React from 'react';
import UserCreateForm from '../../components/admin/UserCreateForm';
import PageWithSidebar from '../../routes/PageWithSidebar';

const UserCreatePage = () => {
  return (
    <PageWithSidebar title="Create New User (Admin)">
      <UserCreateForm />
    </PageWithSidebar>
  );
};

export default UserCreatePage;
