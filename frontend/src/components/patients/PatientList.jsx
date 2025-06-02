import React, { useState, useEffect, useContext } from 'react';
import { listAllPatients } from '../../api/patients'; // Corrected import path
import { AuthContext } from '../../context/AuthContext'; // Corrected import path
import { Link } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner'; // Assuming you want to use your Tailwind-styled spinner
import { USER_ROLES } from '../../utils/constants';
import { formatDate, capitalizeWords } from '../../utils/formatters';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Ensure only authorized roles can fetch the patient list
        if (user && (user.role === USER_ROLES.DOCTOR || user.role === USER_ROLES.NURSE || user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.RECEPTIONIST)) {
          const data = await listAllPatients();
          setPatients(data || []); // Assuming API returns array directly or { results: [] }
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

    if (user) { // Only fetch if user is logged in
        fetchPatients();
    }
  }, [user]); // Dependency on user ensures re-fetch on login/logout or user change

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        {/* Using the Tailwind-styled LoadingSpinner */}
        <LoadingSpinner message="Loading patients..." />
      </div>
    );
  }

  // Render error message
  if (error) {
    return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">{error}</div>;
  }

  // Handle case where user is not authorized (already handled by fetch logic, but good for explicit UI)
  if (!user || !['DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'].includes(user.role)) {
    return <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">Access to patient list is restricted.</div>;
  }

  // Render message if no patients are found
  if (patients.length === 0) {
    return <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">No patients found.</div>;
  }

  // Main patient list rendering
  return (
    // Removed the h3 "Patient List" title from here
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
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patients.map((patient) => (
            // Ensure patient and patient.user are defined before trying to access properties
            patient && patient.user && (
              <tr key={patient.user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{patient.user.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.user.first_name} {patient.user.last_name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.user.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.gender_display || capitalizeWords(patient.gender) || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{patient.phone_number || 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <Link to={`/patients/${patient.user.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View
                  </Link>
                  {/* Add other actions like Edit/Delete if needed, with role checks */}
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
