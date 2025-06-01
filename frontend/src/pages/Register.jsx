import React from "react";
import RegisterForm from "../components/auth/RegisterForm";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;
