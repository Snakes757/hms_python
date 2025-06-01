import React from "react";
import UserCreateForm from "./UserCreateForm"; // Corrected path
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";

const UserCreatePage = () => {
  return (
    <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
      <PageWithSidebar title="Create New User (Admin)">
        <UserCreateForm />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default UserCreatePage;
