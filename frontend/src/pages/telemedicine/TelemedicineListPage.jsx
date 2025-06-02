import React, { useContext } from 'react';
import TelemedicineList from '../../components/telemedicine/TelemedicineList';
import PageWithSidebar from '../../routes/PageWithSidebar'; // Use PageWithSidebar
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';

const TelemedicineListPage = () => {
  const { user: currentUser } = useContext(AuthContext);

  // Check if user has a role that can schedule sessions
  const canScheduleSession = currentUser &&
    (currentUser.role === USER_ROLES.PATIENT ||
     currentUser.role === USER_ROLES.DOCTOR ||
     currentUser.role === USER_ROLES.RECEPTIONIST ||
     currentUser.role === USER_ROLES.ADMIN);

  return (
    // Use PageWithSidebar for consistent layout and header
    <PageWithSidebar title="Telemedicine Sessions">
      <div className="space-y-6"> {/* Use Tailwind for spacing */}
        {canScheduleSession && (
          <div className="flex justify-end"> {/* Tailwind for alignment */}
            <Link
              to="/telemedicine/sessions/new"
              // Use Tailwind classes for the button
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium text-sm leading-tight uppercase rounded-md shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Schedule New Session
            </Link>
          </div>
        )}
        {/* Container for the list with Tailwind styling */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
            <TelemedicineList />
        </div>
      </div>
    </PageWithSidebar>
  );
};

export default TelemedicineListPage;
