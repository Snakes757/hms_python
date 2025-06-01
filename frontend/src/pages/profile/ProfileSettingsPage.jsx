import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { authApi } from "../../api"; // Assuming change password API is in authApi

const ProfileSettingsPage = () => {
  const { user, token } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 10) {
      setError("New password must be at least 10 characters long.");
      return;
    }
    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }

    setIsLoading(true);
    try {
      // Assuming an API endpoint like /users/change-password/
      // This is a placeholder; actual API endpoint might differ.
      // The backend API documentation should specify this.
      // For now, we'll simulate the call.
      // await authApi.changePassword({ old_password: currentPassword, new_password: newPassword });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (currentPassword === "password123") {
        // Simulate incorrect current password
        // throw new Error("Incorrect current password."); // This would be from API
      }

      setSuccess(
        "Password changed successfully! (Simulated - API call not fully implemented)"
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
          "Failed to change password. Please ensure your current password is correct."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <PageWithSidebar title="Profile Settings">
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Manage Your Settings
          </h2>

          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
              Change Password
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
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="10"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 10 characters long.
                </p>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : "Change Password"}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
              Preferences (Placeholder)
            </h3>
            <p className="text-gray-500 italic">
              Notification settings, theme preferences, and other account
              customizations will appear here in a future update.
            </p>
          </div>
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default ProfileSettingsPage;
