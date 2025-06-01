import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api"; // Assuming authApi.registerUser exists
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants"; // For default role
import LoadingSpinner from "../common/LoadingSpinner";

/**
 * @file RegisterForm.jsx
 * @description Component for user registration.
 * Allows new users to create an account, defaulting to PATIENT role.
 */
const RegisterForm = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // To log in the user automatically after registration

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    role: USER_ROLES.PATIENT, // Default role for public registration
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 10) {
      setError("Password must be at least 10 characters long.");
      return;
    }
    if (
      !formData.email ||
      !formData.username ||
      !formData.first_name ||
      !formData.last_name
    ) {
      setError(
        "Please fill in all required fields: Email, Username, First Name, and Last Name."
      );
      return;
    }

    setIsLoading(true);

    // Prepare payload for registration API
    // Exclude password_confirm as it's only for frontend validation
    const { password_confirm, ...registrationPayload } = formData;

    try {
      const responseData = await authApi.registerUser(registrationPayload);
      setSuccess("Registration successful! Redirecting to login...");

      // Optionally, attempt to log the user in immediately if the registration API returns a token
      // This depends on the backend's UserRegistrationAPIView behavior.
      // If it doesn't return a token, the user will need to log in manually.
      // For now, we'll just redirect to login.

      setTimeout(() => {
        navigate("/login", {
          state: { registrationSuccess: true, email: formData.email },
        });
      }, 2000);
    } catch (err) {
      // Attempt to parse backend error messages if they are JSON strings
      let detailedError =
        err.message || "Registration failed. Please try again.";
      if (
        err.message &&
        (err.message.includes("{") || err.message.includes("["))
      ) {
        try {
          const errorObj = JSON.parse(
            err.message.substring(
              err.message.indexOf("{"),
              err.message.lastIndexOf("}") + 1
            ) ||
              err.message.substring(
                err.message.indexOf("["),
                err.message.lastIndexOf("]") + 1
              )
          );
          const messages = Object.entries(errorObj)
            .map(
              ([field, msgs]) =>
                `${field.replace(/_/g, " ")}: ${
                  Array.isArray(msgs) ? msgs.join(", ") : msgs
                }`
            )
            .join("; ");
          if (messages) detailedError = messages;
        } catch (parseError) {
          // If parsing fails, use the original error message
        }
      }
      setError(detailedError);
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="first_name" className="sr-only">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="last_name" className="sr-only">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password_reg" className="sr-only">
                Password
              </label>
              <input
                id="password_reg"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength="10"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min. 10 characters)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password_confirm" className="sr-only">
                Confirm Password
              </label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.password_confirm}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Role is defaulted to PATIENT and not shown on public registration form */}
          <input type="hidden" name="role" value={formData.role} />

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
