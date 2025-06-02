import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { UserContext } from "../../context/UserContext";
// PageWithSidebar is removed from here as it's applied by AppRoutes
import ProtectedRoute from "../../components/common/ProtectedRoute";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { USER_ROLES } from "../../utils/constants";
import { usersApi, authApi } from "../../api"; // Ensure authApi is imported if needed for profile refresh

const UserProfilePage = () => {
  const {
    user: authUser, // Renamed to avoid conflict if 'user' is in profile
    token,
    loading: authLoading,
  } = useContext(AuthContext);

  const {
    profile, // This is the detailed profile from UserContext
    loadingProfile,
    profileError,
    updateUserSpecificProfile, // This function might need adjustment based on how profiles are structured
    setProfile, // Function from UserContext to update the profile state
  } = useContext(UserContext);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(""); // Local error for this page's operations
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize form data when the profile from UserContext is available or changes
    if (profile) {
      const userDetailSource = profile.user || profile; // Handle both nested and flat structures
      const patientProfileSource = profile.patient_profile || profile;
      const doctorProfileSource = profile.doctor_profile || profile;
      const nurseProfileSource = profile.nurse_profile || profile;

      const initialFormData = {
        first_name: userDetailSource.first_name || "",
        last_name: userDetailSource.last_name || "",
        username: userDetailSource.username || "",
        email: userDetailSource.email || "", // Usually not editable directly by user
      };

      if (profile.role === USER_ROLES.DOCTOR) {
        initialFormData.specialization = doctorProfileSource.specialization || "";
        initialFormData.license_number = doctorProfileSource.license_number || "";
      } else if (profile.role === USER_ROLES.NURSE) {
        initialFormData.department = nurseProfileSource.department || "";
      } else if (profile.role === USER_ROLES.PATIENT) {
        initialFormData.date_of_birth = patientProfileSource.date_of_birth || "";
        initialFormData.gender = patientProfileSource.gender || "";
        initialFormData.address = patientProfileSource.address || "";
        initialFormData.phone_number = patientProfileSource.phone_number || "";
        initialFormData.emergency_contact_name = patientProfileSource.emergency_contact_name || "";
        initialFormData.emergency_contact_phone = patientProfileSource.emergency_contact_phone || "";
      }
      setFormData(initialFormData);
    }
  }, [profile]); // Depend on the profile from UserContext

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!authUser || !authUser.id) {
      setError("Authentication error. Cannot update profile.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare payload for general user details (CustomUser model)
      const generalUserUpdatePayload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        // Email is typically not updated here or requires a separate verification process
      };

      // Call the API to update general user details
      // Assuming updateUserProfile from authApi updates the CustomUser model via /users/profile/
      await authApi.updateUserProfile(generalUserUpdatePayload);

      // Prepare payload for role-specific profile details (PatientProfile, DoctorProfile, etc.)
      let roleSpecificProfilePayload = {};
      let roleSpecificUpdateNeeded = false;

      if (profile.role === USER_ROLES.PATIENT) {
        roleSpecificProfilePayload = {
          date_of_birth: formData.date_of_birth || null, // Ensure empty strings become null if backend expects it
          gender: formData.gender || null,
          address: formData.address || null,
          phone_number: formData.phone_number || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
        };
        roleSpecificUpdateNeeded = true;
      } else if (profile.role === USER_ROLES.DOCTOR) {
        roleSpecificProfilePayload = {
          specialization: formData.specialization || null,
          license_number: formData.license_number || null,
        };
        roleSpecificUpdateNeeded = true;
      } else if (profile.role === USER_ROLES.NURSE) {
        roleSpecificProfilePayload = {
          department: formData.department || null,
        };
        roleSpecificUpdateNeeded = true;
      }

      // If there's role-specific data to update, call the appropriate API
      if (roleSpecificUpdateNeeded && Object.keys(roleSpecificProfilePayload).length > 0) {
        // Assuming updateUserSpecificProfile from UserContext handles the role-specific update
        // This function needs to be correctly implemented in UserContext to call the right API
        // e.g., patientsApi.updatePatientByUserId for patients, etc.
        await updateUserSpecificProfile(
          authUser.id, // or profile.user.id / profile.id depending on structure
          roleSpecificProfilePayload,
          profile.role
        );
      }

      // After successful updates, refresh the profile in UserContext
      const refreshedProfile = await authApi.getUserProfile(); // Fetch the latest full profile
      setProfile(refreshedProfile); // Update UserContext

      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError(err.message || "Failed to update profile. Please check the details and try again.");
      console.error("Profile update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine the source of user details for display (could be profile.user or profile directly)
  const displayUser = profile?.user || profile;

  // Loading and error states from UserContext are primary
  if (authLoading || loadingProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  if (profileError) {
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error Loading Profile</p>
        <p>{profileError}</p>
      </div>
    );
  }

  if (!authUser || !profile || !displayUser) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">
          User profile data is not available. Please try logging in again.
        </p>
      </div>
    );
  }
  
  // Removed the PageWithSidebar from here. It's handled by AppRoutes.
  // The ProtectedRoute is also handled by AppRoutes.
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">
          {displayUser.first_name} {displayUser.last_name}'s Profile
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
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm cursor-not-allowed"
            value={formData.email || ""}
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
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm sm:text-sm cursor-not-allowed"
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
                ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                  ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                    ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                        ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                        ? "bg-gray-100 border-gray-300 cursor-not-allowed"
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
                // Reset form data to current profile state
                if (profile) {
                    const userDetailSource = profile.user || profile;
                    const patientProfileSource = profile.patient_profile || profile;
                    const doctorProfileSource = profile.doctor_profile || profile;
                    const nurseProfileSource = profile.nurse_profile || profile;
                    setFormData({
                        first_name: userDetailSource.first_name || "",
                        last_name: userDetailSource.last_name || "",
                        username: userDetailSource.username || "",
                        email: userDetailSource.email || "",
                        specialization: doctorProfileSource.specialization || "",
                        license_number: doctorProfileSource.license_number || "",
                        department: nurseProfileSource.department || "",
                        date_of_birth: patientProfileSource.date_of_birth || "",
                        gender: patientProfileSource.gender || "",
                        address: patientProfileSource.address || "",
                        phone_number: patientProfileSource.phone_number || "",
                        emergency_contact_name: patientProfileSource.emergency_contact_name || "",
                        emergency_contact_phone: patientProfileSource.emergency_contact_phone || "",
                    });
                }
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
  );
};

export default UserProfilePage;
