import React, { useState, useEffect, useContext } from "react";
import { patientsApi } from "../../api"; // Assumes patientsApi is in src/api/index.js
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { GENDERS as GenderEnum } from "../../utils/constants"; // Assuming Gender constants are defined

/**
 * @file PatientForm.jsx
 * @description A form for staff to edit a patient's profile details.
 * This includes fields like date of birth, gender, address, phone, and emergency contacts.
 * It does NOT handle user account creation (email, password, role), which is separate.
 */

/**
 * PatientForm component.
 * @param {object} props - The component's props.
 * @param {string|number} props.patientUserId - The User ID of the patient whose profile is being edited.
 * @param {object} [props.existingPatientData=null] - The existing patient profile data if editing.
 * @param {function} props.onFormSubmit - Callback function executed after successful form submission.
 * @param {function} props.onCancel - Callback function executed when the form is cancelled.
 * @returns {React.ReactElement} The patient profile form.
 */
const PatientForm = ({
  patientUserId,
  existingPatientData = null,
  onFormSubmit,
  onCancel,
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    date_of_birth: "",
    gender: "",
    address: "",
    phone_number: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = Boolean(existingPatientData); // This form is primarily for editing existing patient profiles

  useEffect(() => {
    if (existingPatientData) {
      setFormData({
        date_of_birth: existingPatientData.date_of_birth || "",
        gender: existingPatientData.gender || "",
        address: existingPatientData.address || "",
        phone_number: existingPatientData.phone_number || "",
        emergency_contact_name:
          existingPatientData.emergency_contact_name || "",
        emergency_contact_phone:
          existingPatientData.emergency_contact_phone || "",
      });
    } else {
      // For a new patient profile scenario (less common here, as user creation is separate)
      // this form would typically be populated after a patient user account exists.
      // For now, initialize empty if no existing data.
      setFormData({
        date_of_birth: "",
        gender: "",
        address: "",
        phone_number: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
      });
    }
  }, [existingPatientData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!patientUserId) {
      setError("Patient User ID is missing. Cannot update profile.");
      setIsLoading(false);
      return;
    }

    const payload = { ...formData };
    // Ensure empty strings are sent as null if API expects that for optional fields
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    try {
      // This form is for updating an existing patient's profile details
      const updatedPatient = await patientsApi.updatePatientByUserId(
        patientUserId,
        payload
      );
      setSuccess("Patient profile updated successfully!");
      if (onFormSubmit) {
        onFormSubmit(updatedPatient); // Pass updated data back
      }
    } catch (err) {
      setError(err.message || "Failed to update patient profile.");
      console.error("Error submitting patient profile form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Permission check: Only Admin or Receptionist can edit patient profiles this way.
  // Patients edit their own profile through a different mechanism (e.g., UserProfilePage).
  const canEditPatientProfile =
    currentUser &&
    (currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST");

  if (!canEditPatientProfile) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        You are not authorized to edit patient profiles.
      </div>
    );
  }

  if (!isEditing && !existingPatientData) {
    // This form is designed for editing. If used for creation, it implies a patient user already exists.
    // A more complex creation flow (User + Patient Profile) would be needed for full "new patient" by staff.
    // For now, if no existing data, it's likely an incorrect usage or needs pre-population.
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
        This form is for editing an existing patient's profile. Please load
        patient data first.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-6">
        Edit Patient Profile Details
      </h3>
      {error && (
        <div
          className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
          role="alert"
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="date_of_birth"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              id="date_of_birth"
              value={formData.date_of_birth || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gender
            </label>
            <select
              name="gender"
              id="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Select Gender</option>
              {Object.entries(GenderEnum).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address
          </label>
          <textarea
            name="address"
            id="address"
            rows="3"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="123 Main St, Anytown, USA"
          />
        </div>

        <div>
          <label
            htmlFor="phone_number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number
          </label>
          <input
            type="tel"
            name="phone_number"
            id="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="(555) 123-4567"
          />
        </div>

        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">
            Emergency Contact
          </legend>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="emergency_contact_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="emergency_contact_phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Update Patient Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
