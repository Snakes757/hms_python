import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { inquiriesApi } from "../../api"; // Assumes inquiriesApi is correctly exported from src/api/index.js
import { AuthContext } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatDate } from "../../utils/formatters"; // Assuming a utility for formatting dates

/**
 * @file InquiryDetails.jsx
 * @description Component to display details of a specific inquiry and allow management by authorized staff.
 */

const INQUIRY_STATUS_CHOICES_STAFF = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "PENDING_PATIENT", label: "Pending Patient Response" },
  { value: "ON_HOLD", label: "On Hold" },
];

const InquiryDetails = ({ inquiryIdParam }) => {
  const { inquiryId: routeInquiryId } = useParams();
  const inquiryId = inquiryIdParam || routeInquiryId;

  const [inquiry, setInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editableStatus, setEditableStatus] = useState("");
  const [editableResolutionNotes, setEditableResolutionNotes] = useState("");

  const fetchInquiryDetails = async () => {
    if (!inquiryId) {
      setError("Inquiry ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await inquiriesApi.getInquiryDetails(inquiryId);
      setInquiry(data);
      setEditableStatus(data.status);
      setEditableResolutionNotes(data.resolution_notes || "");
    } catch (err) {
      setError(err.message || "Failed to fetch inquiry details.");
      console.error("Error fetching inquiry details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Only fetch if user is loaded
      fetchInquiryDetails();
    } else if (!currentUser && !localStorage.getItem("authToken")) {
      setError("You must be logged in to view inquiry details.");
      setIsLoading(false);
    }
  }, [inquiryId, currentUser]);

  const canManageInquiry =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      currentUser.role === "RECEPTIONIST" ||
      currentUser.role === "NURSE");

  const handleUpdateInquiry = async (e) => {
    e.preventDefault();
    if (!canManageInquiry) {
      setError("You are not authorized to update this inquiry.");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        status: editableStatus,
        resolution_notes: editableResolutionNotes,
        handled_by: currentUser.id, // Set current staff as handler
      };
      const updatedInquiry = await inquiriesApi.updateInquiry(
        inquiryId,
        payload
      );
      setInquiry(updatedInquiry);
      setSuccess("Inquiry updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update inquiry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!currentUser || currentUser.role !== "ADMIN") {
      setError("You are not authorized to delete inquiries.");
      return;
    }
    if (
      window.confirm(
        "Are you sure you want to permanently delete this inquiry? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      setError("");
      setSuccess("");
      try {
        await inquiriesApi.deleteInquiry(inquiryId);
        setSuccess("Inquiry deleted successfully.");
        navigate("/inquiries", { replace: true });
      } catch (err) {
        setError(err.message || "Failed to delete inquiry.");
        setIsLoading(false);
      }
    }
  };

  if (isLoading && !inquiry) {
    return <LoadingSpinner message="Loading inquiry details..." />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="p-4">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          Inquiry not found or you do not have permission to view it.
        </div>
      </div>
    );
  }

  // Check if current user is the owner of the inquiry (patient)
  const isOwner =
    currentUser &&
    inquiry.patient_details &&
    currentUser.id === inquiry.patient_details.user.id;

  // Patients can only view their own inquiries. Staff can view based on their roles.
  if (!isOwner && !canManageInquiry) {
    return (
      <div className="p-4">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          You do not have permission to view this inquiry.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-4 sm:p-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Inquiry Details</h2>
            {canManageInquiry && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
              >
                Manage Inquiry
              </button>
            )}
          </div>

          {success && (
            <div
              className="m-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
              role="alert"
            >
              {success}
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Subject:{" "}
                <span className="font-normal text-gray-700">
                  {inquiry.subject}
                </span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p>
                <strong className="text-gray-600">Status:</strong>{" "}
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    inquiry.status === "OPEN"
                      ? "bg-blue-200 text-blue-800"
                      : inquiry.status === "RESOLVED" ||
                        inquiry.status === "CLOSED"
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {inquiry.status_display || inquiry.status}
                </span>
              </p>
              <p>
                <strong className="text-gray-600">Submitted:</strong>{" "}
                {formatDate(inquiry.created_at)}
              </p>
              <p>
                <strong className="text-gray-600">Last Updated:</strong>{" "}
                {formatDate(inquiry.updated_at)}
              </p>
              <p>
                <strong className="text-gray-600">Source:</strong>{" "}
                {inquiry.source_display || inquiry.source}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-800 mb-1">
                Inquirer Information:
              </h4>
              <p>
                <strong className="text-gray-600">Name:</strong>{" "}
                {inquiry.inquirer_name}
              </p>
              {inquiry.inquirer_email && (
                <p>
                  <strong className="text-gray-600">Email:</strong>{" "}
                  {inquiry.inquirer_email}
                </p>
              )}
              {inquiry.inquirer_phone && (
                <p>
                  <strong className="text-gray-600">Phone:</strong>{" "}
                  {inquiry.inquirer_phone}
                </p>
              )}
              {inquiry.patient_details && (
                <p>
                  <strong className="text-gray-600">Associated Patient:</strong>{" "}
                  {inquiry.patient_details.user.first_name}{" "}
                  {inquiry.patient_details.user.last_name} (ID:{" "}
                  {inquiry.patient_details.user.id})
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-800 mb-1">Description:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {inquiry.description}
              </p>
            </div>

            {inquiry.handled_by_details && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 mb-1">Handled By:</h4>
                <p className="text-gray-700">
                  {inquiry.handled_by_details.first_name}{" "}
                  {inquiry.handled_by_details.last_name} (
                  {inquiry.handled_by_details.role_display})
                </p>
              </div>
            )}

            {(inquiry.resolution_notes || isEditing) && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-800 mb-1">
                  Resolution Notes:
                </h4>
                {isEditing && canManageInquiry ? (
                  <textarea
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    rows="4"
                    value={editableResolutionNotes}
                    onChange={(e) => setEditableResolutionNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                  />
                ) : (
                  ((
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {inquiry.resolution_notes || "No resolution notes yet."}
                    </p>
                  ),
                  canManageInquiry && !isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditableResolutionNotes(
                          inquiry.resolution_notes || ""
                        );
                        setEditableStatus(inquiry.status);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Edit Notes/Status
                    </button>
                  ))
                )}
              </div>
            )}

            {isEditing && canManageInquiry && (
              <form
                onSubmit={handleUpdateInquiry}
                className="space-y-4 border-t border-gray-200 pt-4"
              >
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Update Status:
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={editableStatus}
                    onChange={(e) => setEditableStatus(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {INQUIRY_STATUS_CHOICES_STAFF.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError(""); // Clear previous errors when cancelling
                      // Reset editable fields to original inquiry values
                      setEditableStatus(inquiry.status);
                      setEditableResolutionNotes(
                        inquiry.resolution_notes || ""
                      );
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition duration-150 ease-in-out"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {currentUser && currentUser.role === "ADMIN" && !isEditing && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={handleDeleteInquiry}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    "Delete Inquiry (Admin)"
                  )}
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/inquiries"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                &larr; Back to All Inquiries
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryDetails;
