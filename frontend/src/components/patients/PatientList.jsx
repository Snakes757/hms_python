import React, { useState, useEffect, useContext } from 'react';
import { listAllPatients } from '../../api/patients'; // Assuming this correctly fetches patient-specific list or all users that are patients
import { deleteUserById } from '../../api/users'; // API to delete a user
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants';
import { formatDate, capitalizeWords } from '../../utils/formatters';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline'; // Import TrashIcon

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext); // Renamed to avoid conflict

  const fetchPatients = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Ensure only authorized users can fetch the list.
      // The API should ideally handle role-based access, but an additional check here is good.
      if (currentUser && (currentUser.role === USER_ROLES.DOCTOR || currentUser.role === USER_ROLES.NURSE || currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.RECEPTIONIST)) {
        const data = await listAllPatients(); // This API should return users with the role PATIENT
        setPatients(data || []); // data.results or data, depending on API structure
      } else {
        setError("You are not authorized to view this list.");
        setPatients([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch patients.');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) { // Check if currentUser is available
        fetchPatients();
    }
  }, [currentUser]); // Re-fetch if currentUser changes

  const handleDeletePatient = async (patientUserIdToDelete) => {
    if (!currentUser || currentUser.role !== USER_ROLES.ADMIN) {
        setError("You are not authorized to delete patients.");
        return;
    }
    if (patientUserIdToDelete === currentUser.id) {
        setError("You cannot delete your own account from this list.");
        return;
    }

    // Replace window.confirm with a custom modal in a real app for better UX
    if (window.confirm(`Are you sure you want to permanently delete patient with User ID: ${patientUserIdToDelete}? This action cannot be undone.`)) {
        setIsLoading(true); // Consider a more granular loading state
        try {
            await deleteUserById(patientUserIdToDelete); // Using deleteUserById as patients are users
            setPatients(prevPatients => prevPatients.filter(p => p.user.id !== patientUserIdToDelete));
            setError(''); // Clear any previous errors
        } catch (err) {
            setError(err.message || 'Failed to delete patient.');
            console.error("Delete patient error:", err);
        } finally {
            setIsLoading(false);
        }
    }
  };


  if (isLoading && patients.length === 0) {
    return (
      <div className="flex justify-center items-center p-10">
        <LoadingSpinner message="Loading patients..." />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>;
  }

  if (!currentUser || !['DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'].includes(currentUser.role)) {
    return <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">Access to patient list is restricted.</div>;
  }

  if (patients.length === 0) {
    return <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">No patients found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID (User)</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patients.map((patient) => (
            // Ensure patient and patient.user exist to prevent errors
            patient && patient.user && (
              <tr key={patient.user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{patient.user.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.user.first_name} {patient.user.last_name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.gender_display || capitalizeWords(patient.gender) || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.phone_number || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link 
                    to={`/patients/${patient.user.id}`} 
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    title="View Patient Details"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" /> View
                  </Link>
                  {currentUser && currentUser.role === USER_ROLES.ADMIN && patient.user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDeletePatient(patient.user.id)}
                      disabled={isLoading} // Disable button during any loading state
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      title="Delete Patient"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" /> Delete
                    </button>
                  )}
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
