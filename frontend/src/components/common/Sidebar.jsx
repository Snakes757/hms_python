import React, { useContext } from "react";
import { NavLink, Link } from "react-router-dom"; // Using NavLink for active styling
import { AuthContext } from "../../context/AuthContext";
import { USER_ROLES } from "../../utils/constants";
import usePermissions from "../../hooks/usePermissions"; // For more granular permission checks if needed

/**
 * @file Sidebar.jsx
 * @description A responsive sidebar navigation component for the application.
 * Links displayed are conditional based on the authenticated user's role and permissions.
 */

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isRole } = usePermissions(); // Utilizes the usePermissions hook for role checks

  if (!user) {
    return null; // Sidebar is not rendered if no user is logged in
  }

  const commonLinks = [
    {
      name: "Dashboard",
      path: "/",
      icon: "M12 6.253v11.494m0 0A8.001 8.001 0 004 17.747m8 0A8.001 8.001 0 0120 17.747M12 6.253L15 3m-3 3.253L9 3",
    }, // Generic dashboard link
    {
      name: "My Profile",
      path: "/profile/me",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  const patientLinks = [
    {
      name: "My Appointments",
      path: "/appointments",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "My Medical Info",
      path: `/patients/${user?.id}`,
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      name: "My Invoices",
      path: "/billing/invoices",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    },
    {
      name: "My Telemedicine",
      path: "/telemedicine/sessions",
      icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
    {
      name: "Submit Inquiry",
      path: "/inquiries/new",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  const staffLinks = [
    // Links common to most staff
    {
      name: "Patient List",
      path: "/patients",
      roles: [
        USER_ROLES.DOCTOR,
        USER_ROLES.NURSE,
        USER_ROLES.RECEPTIONIST,
        USER_ROLES.ADMIN,
      ],
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      name: "Appointments",
      path: "/appointments",
      roles: [
        USER_ROLES.DOCTOR,
        USER_ROLES.NURSE,
        USER_ROLES.RECEPTIONIST,
        USER_ROLES.ADMIN,
      ],
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      name: "Telemedicine",
      path: "/telemedicine/sessions",
      roles: [USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN],
      icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    },
    {
      name: "Manage Inquiries",
      path: "/inquiries",
      roles: [USER_ROLES.NURSE, USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN],
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
  ];

  const doctorSpecificLinks = [
    // { name: "My Schedule", path: "/doctor/schedule", roles: [USER_ROLES.DOCTOR], icon: "..." }, // Example
  ];

  const receptionistSpecificLinks = [
    {
      name: "Billing Dashboard",
      path: "/billing/dashboard",
      roles: [USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN],
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    },
    {
      name: "Register Patient",
      path: "/register",
      roles: [USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN],
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    }, // Note: /register is public, but admin/receptionist might use a specific version or context
  ];

  const adminLinks = [
    {
      name: "User Management",
      path: "/admin/users",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      name: "System Reports",
      path: "/admin/reports",
      icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    // Link to Django Admin for Audit Logs is usually external, better placed on AdminDashboard
  ];

  const NavItem = ({ path, name, iconPath }) => (
    <li>
      <NavLink
        to={path}
        className={({ isActive }) =>
          `flex items-center p-3 my-1 text-sm rounded-lg transition-colors duration-150 ease-in-out
          ${
            isActive
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
          }`
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-3 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
        {name}
      </NavLink>
    </li>
  );

  const SectionTitle = ({ title }) => (
    <li className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3">
      {title}
    </li>
  );

  return (
    <nav
      id="sidebarMenu"
      className="w-64 bg-white border-r border-gray-200 h-screen fixed top-0 left-0 pt-16 lg:pt-0 lg:relative lg:translate-x-0 transform -translate-x-full lg:sticky overflow-y-auto transition-transform duration-200 ease-in-out shadow-lg z-30"
    >
      <div className="p-4">
        <Link to="/" className="flex items-center mb-6">
          {/* Placeholder for a logo if available */}
          <svg
            className="h-8 w-auto text-blue-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z"
            />
          </svg>
          <span className="ml-3 text-xl font-semibold text-gray-800">
            HMS Portal
          </span>
        </Link>

        <ul className="space-y-1">
          {commonLinks.map((link) => (
            <NavItem key={link.name} {...link} iconPath={link.icon} />
          ))}

          {isRole.isPatient && (
            <>
              <SectionTitle title="Patient Menu" />
              {patientLinks.map((link) => (
                <NavItem key={link.name} {...link} iconPath={link.icon} />
              ))}
            </>
          )}

          {(isRole.isDoctor ||
            isRole.isNurse ||
            isRole.isReceptionist ||
            isRole.isAdmin) && (
            <>
              <SectionTitle title="Staff Menu" />
              {staffLinks
                .filter((link) => !link.roles || link.roles.includes(user.role))
                .map((link) => (
                  <NavItem key={link.name} {...link} iconPath={link.icon} />
                ))}
            </>
          )}

          {isRole.isDoctor && doctorSpecificLinks.length > 0 && (
            <>
              {/* <SectionTitle title="Doctor Tools" /> */}
              {doctorSpecificLinks.map((link) => (
                <NavItem key={link.name} {...link} iconPath={link.icon} />
              ))}
            </>
          )}

          {(isRole.isReceptionist || isRole.isAdmin) &&
            receptionistSpecificLinks.length > 0 && (
              <>
                {/* <SectionTitle title="Reception Tools" /> */}
                {receptionistSpecificLinks
                  .filter(
                    (link) => !link.roles || link.roles.includes(user.role)
                  )
                  .map((link) => (
                    <NavItem key={link.name} {...link} iconPath={link.icon} />
                  ))}
              </>
            )}

          {isRole.isAdmin && (
            <>
              <SectionTitle title="Administration" />
              {adminLinks.map((link) => (
                <NavItem key={link.name} {...link} iconPath={link.icon} />
              ))}
            </>
          )}

          <li className="pt-4 mt-4 border-t border-gray-200">
            <NavLink
              to="/profile/settings" // Assuming a settings page exists
              className={({ isActive }) =>
                `flex items-center p-3 my-1 text-sm rounded-lg transition-colors duration-150 ease-in-out
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                }`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </NavLink>
          </li>
          <li>
            <button
              onClick={logout}
              className="flex items-center w-full p-3 my-1 text-sm text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors duration-150 ease-in-out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
