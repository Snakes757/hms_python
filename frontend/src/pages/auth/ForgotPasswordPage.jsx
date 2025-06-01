import React from "react";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
};

export default ForgotPasswordPage;
