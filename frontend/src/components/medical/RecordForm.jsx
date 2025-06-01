import React, { useState, useEffect, useContext } from "react";
import { medicalRecordsApi } from "../../api"; // Assuming medicalRecordsApi is in src/api/index.js
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

/**
 * @file RecordForm.jsx
 * @description A form component for creating or editing a patient's medical record.
 * Includes fields for diagnosis, symptoms, treatment plan, notes, and record date.
 */

/**
 * RecordForm component.
 * @param {object} props - The component's props.
 * @param {string|number} props.patientUserId - The User ID of the patient for whom the record is being created/edited.
 * @param {object} [props.existingRecord=null] - The existing medical record object if editing.
 * @param {function} props.onFormSubmit - Callback function executed after successful form submission.
 * @param {function} props.onCancel - Callback function executed when the form is cancelled.
 * @returns {React.ReactElement} The medical record form.
 */
const RecordForm = ({
  patientUserId,
  existingRecord = null,
  onFormSubmit,
  onCancel,
}) => {
  const { user: currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().slice(0, 16), // Default to current date and time
    diagnosis: "",
    symptoms: "",
    treatment_plan: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = Boolean(existingRecord && existingRecord.id);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        record_date: existingRecord.record_date
          ? new Date(existingRecord.record_date).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        diagnosis: existingRecord.diagnosis || "",
        symptoms: existingRecord.symptoms || "",
        treatment_plan: existingRecord.treatment_plan || "",
        notes: existingRecord.notes || "",
      });
    } else {
      // Reset form for new record
      setFormData({
        record_date: new Date().toISOString().slice(0, 16),
        diagnosis: "",
        symptoms: "",
        treatment_plan: "",
        notes: "",
      });
    }
  }, [existingRecord, isEditing]);

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
      setError("Patient User ID is missing.");
      setIsLoading(false);
      return;
    }

    const payload = {
      ...formData,
      patient: parseInt(patientUserId), // Ensure patient ID is an integer if API expects it
      // created_by will be set by the backend based on the authenticated user
    };

    try {
      if (isEditing) {
        await medicalRecordsApi.updateMedicalRecord(
          patientUserId,
          existingRecord.id,
          payload
        );
        setSuccess("Medical record updated successfully!");
      } else {
        await medicalRecordsApi.createMedicalRecord(patientUserId, payload);
        setSuccess("Medical record created successfully!");
      }
      if (onFormSubmit) {
        onFormSubmit(); // Callback to refresh list or close modal
      }
    } catch (err) {
      setError(
        err.message ||
          `Failed to ${isEditing ? "update" : "create"} medical record.`
      );
      console.error("Error submitting medical record form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic permission check - refine as needed with usePermissions hook
  const canManageRecords =
    currentUser &&
    (currentUser.role === "DOCTOR" ||
      currentUser.role === "NURSE" ||
      currentUser.role === "ADMIN");

  if (!canManageRecords) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        You are not authorized to manage medical records.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-6">
        {isEditing ? "Edit Medical Record" : "Add New Medical Record"}
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
        <div>
          <label
            htmlFor="record_date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Record Date and Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            name="record_date"
            id="record_date"
            value={formData.record_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="diagnosis"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Diagnosis
          </label>
          <textarea
            name="diagnosis"
            id="diagnosis"
            rows="3"
            value={formData.diagnosis}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter diagnosis details..."
          />
        </div>

        <div>
          <label
            htmlFor="symptoms"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Symptoms
          </label>
          <textarea
            name="symptoms"
            id="symptoms"
            rows="3"
            value={formData.symptoms}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Describe observed symptoms..."
          />
        </div>

        <div>
          <label
            htmlFor="treatment_plan"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Treatment Plan
          </label>
          <textarea
            name="treatment_plan"
            id="treatment_plan"
            rows="3"
            value={formData.treatment_plan}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Outline the treatment plan..."
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Additional Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Any other relevant notes..."
          />
        </div>

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
            ) : isEditing ? (
              "Update Record"
            ) : (
              "Save Record"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordForm;
