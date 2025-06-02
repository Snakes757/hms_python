import React, { useState, useContext } from "react";
import { authApi } from "../../api"; // Assuming authApi is correctly exported from your api/index.js or api/auth.js
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { USER_ROLES as ROLE_CONSTANTS } from "../../utils/constants";

const UserCreateForm = () => {
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const initialFormData = {
    username: "",
    email: "",
    password: "",
    password_confirm: "", // Added for confirmation
    first_name: "",
    last_name: "",
    role: ROLE_CONSTANTS.PATIENT,
    is_active: true, // Default to active
    doctor_profile: { specialization: "", license_number: "" },
    nurse_profile: { department: "" },
  };
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (
      name.startsWith("doctor_profile.") ||
      name.startsWith("nurse_profile.")
    ) {
      const [profileType, fieldName] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [profileType]: {
          ...prev[profileType],
          [fieldName]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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
      setError("Email, Username, First Name, and Last Name are required.");
      return;
    }

    setIsLoading(true);

    // Construct the payload to be sent to the API
    const registrationPayload = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      password_confirm: formData.password_confirm, // Include password_confirm
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      is_active: formData.is_active, // Include is_active status
    };

    // Add role-specific profiles if applicable
    if (formData.role === ROLE_CONSTANTS.DOCTOR) {
      registrationPayload.doctor_profile = formData.doctor_profile;
    }
    if (formData.role === ROLE_CONSTANTS.NURSE) {
      registrationPayload.nurse_profile = formData.nurse_profile;
    }

    try {
      // Call the API to register the user
      await authApi.registerUser(registrationPayload);
      setSuccess(
        `User ${registrationPayload.username} created successfully. They can now log in. Profile-specific details (like specialization for doctors) have been submitted.`
      );
      setFormData(initialFormData); // Reset form
      setTimeout(() => navigate("/admin/users"), 3000); // Redirect after a delay
    } catch (err) {
      // Parse and display detailed error messages if available
      let detailedError =
        err.message || "User creation failed. Please try again.";
      if (
        err.message &&
        (err.message.includes("{") || err.message.includes("["))
      ) {
        try {
          // Attempt to parse JSON-like error string
          const errorString = err.message.substring(err.message.indexOf("{"), err.message.lastIndexOf("}") + 1) ||
                              err.message.substring(err.message.indexOf("["), err.message.lastIndexOf("]") + 1);
          const errorObj = JSON.parse(errorString);
          const messages = Object.entries(errorObj)
            .map(
              ([field, msgs]) =>
                `${field.replace(/_/g, " ")}: ${
                  Array.isArray(msgs) ? msgs.join(", ") : msgs
                }`
            )
            .join("; ");
          if (messages) detailedError = messages;
        } catch (_parseError) {
          // Parsing failed, use the original message
          console.warn("Could not parse detailed error message from API:", _parseError);
        }
      }
      setError(detailedError);
      console.error("User creation error object:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== ROLE_CONSTANTS.ADMIN) {
    return (
      <p className="text-red-500 p-4">
        Access Denied. Admin role required to create users.
      </p>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">
        Create New User Account
      </h3>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="adminCreate_username"
              className="block text-sm font-medium text-gray-700"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              id="adminCreate_username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="adminCreate_email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="adminCreate_email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Password and Confirm Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="adminCreate_password"
              className="block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              id="adminCreate_password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="10"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Min. 10 characters.</p>
          </div>
          <div>
            <label
              htmlFor="adminCreate_password_confirm"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password_confirm"
              id="adminCreate_password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>

        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="adminCreate_first_name"
              className="block text-sm font-medium text-gray-700"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              id="adminCreate_first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="adminCreate_last_name"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              id="adminCreate_last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label
            htmlFor="adminCreate_role"
            className="block text-sm font-medium text-gray-700"
          >
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            id="adminCreate_role"
            value={formData.role}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
          >
            {Object.entries(ROLE_CONSTANTS).map(([key, value]) => (
              <option key={key} value={key}>
                {value} 
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Specific Profile Fields */}
        {formData.role === ROLE_CONSTANTS.DOCTOR && (
          <fieldset className="border border-gray-300 p-4 rounded-md mt-4">
            <legend className="text-sm font-medium text-gray-700 px-1">
              Doctor Specific Profile
            </legend>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="adminCreate_specialization"
                  className="block text-sm font-medium text-gray-700"
                >
                  Specialization
                </label>
                <input
                  type="text"
                  name="doctor_profile.specialization" // Note the naming convention for nested state
                  id="adminCreate_specialization"
                  value={formData.doctor_profile.specialization}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="adminCreate_license_number"
                  className="block text-sm font-medium text-gray-700"
                >
                  License Number
                </label>
                <input
                  type="text"
                  name="doctor_profile.license_number" // Note the naming convention
                  id="adminCreate_license_number"
                  value={formData.doctor_profile.license_number}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                />
              </div>
            </div>
          </fieldset>
        )}

        {/* Nurse Specific Profile Fields */}
        {formData.role === ROLE_CONSTANTS.NURSE && (
          <fieldset className="border border-gray-300 p-4 rounded-md mt-4">
            <legend className="text-sm font-medium text-gray-700 px-1">
              Nurse Specific Profile
            </legend>
            <div>
              <label
                htmlFor="adminCreate_department"
                className="block text-sm font-medium text-gray-700"
              >
                Department
              </label>
              <input
                type="text"
                name="nurse_profile.department" // Note the naming convention
                id="adminCreate_department"
                value={formData.nurse_profile.department}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
            </div>
          </fieldset>
        )}

        {/* Account Activation Status */}
        <div className="pt-2">
          <div className="flex items-center">
            <input
              id="adminCreate_is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
            />
            <label
              htmlFor="adminCreate_is_active"
              className="ml-2 block text-sm text-gray-900"
            >
              Activate account upon creation
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Staff status (is_staff, is_superuser) can be managed via the User
            Details Edit page after creation.
          </p>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="flex justify-end space-x-3 pt-5">
          <button
            type="button"
            onClick={() => navigate("/admin/users")}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Create User Account"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreateForm;
