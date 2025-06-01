import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { UserContext } from "../../context/UserContext"; // Using UserContext for profile data
import PageWithSidebar from "../../routes/PageWithSidebar";
import ProtectedRoute from "../../components/common/ProtectedRoute";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { USER_ROLES } from "../../utils/constants";
import { usersApi } from "../../api"; // For specific profile updates if needed

const UserProfilePage = () => {
  const {
    user: authUser,
    token,
    loading: authLoading,
  } = useContext(AuthContext);
  // Use UserContext for profile data and updates
  const {
    profile,
    loadingProfile,
    profileError,
    updateUserSpecificProfile,
    setProfile,
  } = useContext(UserContext);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      const initialFormData = {
        first_name: profile.user?.first_name || profile.first_name || "",
        last_name: profile.user?.last_name || profile.last_name || "",
        username: profile.user?.username || profile.username || "",
        email: profile.user?.email || profile.email || "", // Email is part of CustomUser
      };

      if (profile.role === USER_ROLES.DOCTOR) {
        initialFormData.specialization =
          profile.doctor_profile?.specialization ||
          profile.specialization ||
          "";
        initialFormData.license_number =
          profile.doctor_profile?.license_number ||
          profile.license_number ||
          "";
      } else if (profile.role === USER_ROLES.NURSE) {
        initialFormData.department =
          profile.nurse_profile?.department || profile.department || "";
      } else if (profile.role === USER_ROLES.PATIENT) {
        initialFormData.date_of_birth =
          profile.patient_profile?.date_of_birth || profile.date_of_birth || "";
        initialFormData.gender =
          profile.patient_profile?.gender || profile.gender || "";
        initialFormData.address =
          profile.patient_profile?.address || profile.address || "";
        initialFormData.phone_number =
          profile.patient_profile?.phone_number || profile.phone_number || "";
        initialFormData.emergency_contact_name =
          profile.patient_profile?.emergency_contact_name ||
          profile.emergency_contact_name ||
          "";
        initialFormData.emergency_contact_phone =
          profile.patient_profile?.emergency_contact_phone ||
          profile.emergency_contact_phone ||
          "";
      }
      setFormData(initialFormData);
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const userUpdatePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        // Email is generally not updated here by user, but by admin or separate process
      };

      let profileSpecificPayload = {};
      if (profile.role === USER_ROLES.DOCTOR) {
        profileSpecificPayload = {
          specialization: formData.specialization,
          license_number: formData.license_number,
        };
      } else if (profile.role === USER_ROLES.NURSE) {
        profileSpecificPayload = {
          department: formData.department,
        };
      } else if (profile.role === USER_ROLES.PATIENT) {
        profileSpecificPayload = {
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
          phone_number: formData.phone_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
        };
      }

      // Update CustomUser fields (first_name, last_name, username) via usersApi.updateUserById
      // The API structure might need adjustment if /users/profile/me only updates CustomUser fields
      // and separate endpoints are needed for role-specific profiles.
      // For now, assuming updateUserSpecificProfile in UserContext handles this logic.

      await usersApi.updateUserById(authUser.id, userUpdatePayload); // Update core user fields

      if (Object.keys(profileSpecificPayload).length > 0) {
        await updateUserSpecificProfile(
          authUser.id,
          profileSpecificPayload,
          profile.role
        ); // Update role-specific profile
      } else {
        // If no specific profile fields, refresh main profile from context after CustomUser update
        const refreshedProfile = await usersApi.authApi.getUserProfile();
        setProfile(refreshedProfile); // Update UserContext
      }

      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
      console.error("Profile update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveProfile = profile || {}; // Use empty object if profile is null
  const userDetails = effectiveProfile.user || effectiveProfile; // Handle nested user object if present

  if (authLoading || loadingProfile) {
    return (
      <PageWithSidebar title="My Profile">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </PageWithSidebar>
    );
  }

  if (profileError) {
    return (
      <PageWithSidebar title="My Profile - Error">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error Loading Profile</p>
          <p>{profileError}</p>
        </div>
      </PageWithSidebar>
    );
  }

  if (!authUser || !profile) {
    return (
      <PageWithSidebar title="My Profile">
        <div className="text-center p-8">
          <p className="text-gray-600">
            User profile data is not available. Please try logging in again.
          </p>
        </div>
      </PageWithSidebar>
    );
  }

  return (
    <ProtectedRoute>
      <PageWithSidebar title="My Profile">
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-semibold text-gray-800">
              {userDetails.first_name} {userDetails.last_name}'s Profile
            </h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

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
            <div>
              <label
                htmlFor="emailDisplay"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="emailDisplay"
                className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                value={userDetails.email || ""}
                disabled
                readOnly
              />
            </div>
            <div>
              <label
                htmlFor="roleDisplay"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <input
                type="text"
                id="roleDisplay"
                className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                value={profile.role_display || profile.role || ""}
                disabled
                readOnly
              />
            </div>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                  !editMode
                    ? "bg-gray-100 border-gray-300"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                value={formData.username || ""}
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                  !editMode
                    ? "bg-gray-100 border-gray-300"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                value={formData.first_name || ""}
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                  !editMode
                    ? "bg-gray-100 border-gray-300"
                    : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                }`}
                value={formData.last_name || ""}
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>

            {profile.role === USER_ROLES.DOCTOR && (
              <>
                <div>
                  <label
                    htmlFor="specialization"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    id="specialization"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                      !editMode
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={formData.specialization || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label
                    htmlFor="license_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    License Number
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    id="license_number"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                      !editMode
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={formData.license_number || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </>
            )}

            {profile.role === USER_ROLES.NURSE && (
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700"
                >
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  id="department"
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                    !editMode
                      ? "bg-gray-100 border-gray-300"
                      : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  }`}
                  value={formData.department || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>
            )}

            {profile.role === USER_ROLES.PATIENT && (
              <>
                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                      !editMode
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={formData.date_of_birth || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                      !editMode
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={formData.gender || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <textarea
                    name="address"
                    id="address"
                    rows="3"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                      !editMode
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={formData.address || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  ></textarea>
                </div>
                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    id="phone_number"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                      !editMode
                        ? "bg-gray-100 border-gray-300"
                        : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    }`}
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <fieldset className="mt-4 border border-gray-300 p-4 rounded-md">
                  <legend className="text-sm font-medium text-gray-700 px-1">
                    Emergency Contact
                  </legend>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="emergency_contact_name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        id="emergency_contact_name"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          !editMode
                            ? "bg-gray-100 border-gray-300"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
                        value={formData.emergency_contact_name || ""}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="emergency_contact_phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="emergency_contact_phone"
                        id="emergency_contact_phone"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          !editMode
                            ? "bg-gray-100 border-gray-300"
                            : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                        }`}
                        value={formData.emergency_contact_phone || ""}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                </fieldset>
              </>
            )}

            {editMode && (
              <div className="flex justify-end space-x-3 pt-5">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                  onClick={() => {
                    setEditMode(false);
                    setError("");
                    setSuccess("");
                    setFormData(
                      profile
                        ? {
                            first_name:
                              profile.user?.first_name ||
                              profile.first_name ||
                              "",
                            last_name:
                              profile.user?.last_name ||
                              profile.last_name ||
                              "",
                            username:
                              profile.user?.username || profile.username || "",
                            email: profile.user?.email || profile.email || "",
                            specialization:
                              profile.doctor_profile?.specialization ||
                              profile.specialization ||
                              "",
                            license_number:
                              profile.doctor_profile?.license_number ||
                              profile.license_number ||
                              "",
                            department:
                              profile.nurse_profile?.department ||
                              profile.department ||
                              "",
                            date_of_birth:
                              profile.patient_profile?.date_of_birth ||
                              profile.date_of_birth ||
                              "",
                            gender:
                              profile.patient_profile?.gender ||
                              profile.gender ||
                              "",
                            address:
                              profile.patient_profile?.address ||
                              profile.address ||
                              "",
                            phone_number:
                              profile.patient_profile?.phone_number ||
                              profile.phone_number ||
                              "",
                            emergency_contact_name:
                              profile.patient_profile?.emergency_contact_name ||
                              profile.emergency_contact_name ||
                              "",
                            emergency_contact_phone:
                              profile.patient_profile
                                ?.emergency_contact_phone ||
                              profile.emergency_contact_phone ||
                              "",
                          }
                        : {}
                    );
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoadingSpinner size="sm" /> : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </PageWithSidebar>
    </ProtectedRoute>
  );
};

export default UserProfilePage;
