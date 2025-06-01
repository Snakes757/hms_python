import React from "react";
import { useParams } from "react-router-dom";
import UserDetailsEdit from "../../components/admin/UserDetailsEdit";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import { USER_ROLES } from "../../utils/constants";

const UserDetailsPage = () => {
  const { userId } = useParams();

  return (
    <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
      <PageWithSidebar title={`Manage User Details (ID: ${userId})`}>
        <UserDetailsEdit userIdParam={userId} />
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default UserDetailsPage;
