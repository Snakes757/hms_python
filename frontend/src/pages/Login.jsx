import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { authApi } from "../api";
import LoadingSpinner from "../components/common/LoadingSpinner"; // Ensure this path is correct

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: location.state?.email || "", // Pre-fill email if coming from registration
    password: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.registrationSuccess
      ? "Registration successful! Please log in."
      : ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage(""); // Clear previous success message on new attempt
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.loginUser({
        email: formData.email,
        password: formData.password,
      });
      login(data.user, data.token); // Update AuthContext
      // Redirect to the page the user was trying to access, or to the homepage
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Using a dark theme for the login page container
    <div className="min-h-[calc(100vh-192px)] bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Hospital/System Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-auto text-sky-400" // Adjusted icon color for better contrast
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5} // Adjusted stroke width for a slightly bolder icon
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            // A simple hospital or health icon
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Or{" "}
          <Link
            to="/register"
            className="font-medium text-sky-400 hover:text-sky-300"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl rounded-xl sm:px-10">
          {/* Display registration success message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-600/30 border border-green-500 text-green-300 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          {/* Display login error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-600/30 border border-red-500 text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-slate-700 text-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-slate-700 text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Remember me checkbox can be added here if needed */}
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-sky-400 hover:text-sky-300"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "Sign in"}
              </button>
            </div>
          </form>
          {/* Removed the duplicate "Loading..." text elements if they were here */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Need help?{" "}
              <Link
                to="/contact-us" // Assuming you have a contact page
                className="font-medium text-sky-400 hover:text-sky-300"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
