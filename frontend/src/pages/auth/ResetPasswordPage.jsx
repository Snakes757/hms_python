import React from "react";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPasswordPage;
