import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { logoutUser } from '../../api/auth'; // Assuming this is correctly set up
import { USER_ROLES } from '../../utils/constants'; // Assuming this is correctly set up

// Heroicons v2 (ensure @heroicons/react is installed - v2.x is expected)
// Icons are now imported from specific style/size directories e.g., /24/outline
import {
  HomeIcon,
  UserGroupIcon,
  UserCircleIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon, // LogoutIcon is ArrowLeftOnRectangleIcon in v2
  Bars3Icon, // MenuIcon is Bars3Icon in v2
  XMarkIcon, // XIcon is XMarkIcon in v2
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'; // Using 24px outline icons

const Header = () => {
  const { user, setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null); // For click outside to close

  const handleLogout = async () => {
    try {
      await logoutUser(); // Call your API logout function
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Still proceed with local logout even if API fails
    } finally {
      setUser(null);
      setToken(null);
      // localStorage.removeItem('authToken'); // Handled by AuthContext/authApi.js
      // localStorage.removeItem('userData'); // Handled by AuthContext/authApi.js
      setMobileMenuOpen(false); // Close mobile menu on logout
      navigate('/login');
    }
  };

  // Close mobile menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const NavLinkItem = ({ to, children, icon: Icon, onClick }) => (
    <Link
      to={to}
      onClick={() => {
        setMobileMenuOpen(false);
        if (onClick) onClick();
      }}
      className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
    >
      {Icon && <Icon className="h-5 w-5 mr-2 flex-shrink-0" />}
      {children}
    </Link>
  );

  const MobileNavLinkItem = ({ to, children, icon: Icon, onClick }) => (
     <Link
      to={to}
      onClick={() => {
        setMobileMenuOpen(false);
        if (onClick) onClick();
      }}
      className="flex items-center px-3 py-3 text-base font-medium text-slate-200 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
    >
      {Icon && <Icon className="h-6 w-6 mr-3 flex-shrink-0" />}
      {children}
    </Link>
  );


  return (
    <nav className="bg-slate-800 shadow-lg" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              {/* Replace with your SVG logo or text */}
              <svg className="h-8 w-auto text-sky-400" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-white">HMS</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4">
            <NavLinkItem to="/" icon={HomeIcon}>Home</NavLinkItem>
            {user && user.role === USER_ROLES.ADMIN && (
              <NavLinkItem to="/admin/dashboard" icon={ShieldCheckIcon}>Admin</NavLinkItem>
            )}
            {user && (user.role === USER_ROLES.DOCTOR || user.role === USER_ROLES.NURSE || user.role === USER_ROLES.RECEPTIONIST || user.role === USER_ROLES.ADMIN) && (
              <NavLinkItem to="/patients" icon={UserGroupIcon}>Patients</NavLinkItem>
            )}
             {user && (user.role === USER_ROLES.DOCTOR || user.role === USER_ROLES.NURSE || user.role === USER_ROLES.RECEPTIONIST || user.role === USER_ROLES.ADMIN) && (
              <NavLinkItem to="/appointments" icon={DocumentTextIcon}>Appointments</NavLinkItem>
            )}
            {/* Add more desktop nav links as needed */}
          </div>

          {/* User menu / Auth links - Desktop */}
          <div className="hidden md:flex md:items-center md:ml-6">
            {user ? (
              <div className="relative flex items-center space-x-3">
                <span className="text-sm text-slate-300">
                  Hi, {user.first_name || user.username}!
                </span>
                <NavLinkItem to="/profile/me" icon={UserCircleIcon}>Profile</NavLinkItem>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" /> {/* Updated Icon */}
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <NavLinkItem to="/login">Login</NavLinkItem>
                <NavLinkItem to="/register">Register</NavLinkItem>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" /> /* Updated Icon */
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" /> /* Updated Icon */
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 z-40 transform origin-top-right transition ease-out duration-100" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1 px-2 sm:px-3 bg-slate-800 shadow-xl ring-1 ring-black ring-opacity-5">
            <MobileNavLinkItem to="/" icon={HomeIcon}>Home</MobileNavLinkItem>
            {user && user.role === USER_ROLES.ADMIN && (
              <MobileNavLinkItem to="/admin/dashboard" icon={ShieldCheckIcon}>Admin Dashboard</MobileNavLinkItem>
            )}
            {user && (user.role === USER_ROLES.DOCTOR || user.role === USER_ROLES.NURSE || user.role === USER_ROLES.RECEPTIONIST || user.role === USER_ROLES.ADMIN) && (
              <MobileNavLinkItem to="/patients" icon={UserGroupIcon}>Patients</MobileNavLinkItem>
            )}
            {user && (user.role === USER_ROLES.DOCTOR || user.role === USER_ROLES.NURSE || user.role === USER_ROLES.RECEPTIONIST || user.role === USER_ROLES.ADMIN) && (
              <MobileNavLinkItem to="/appointments" icon={DocumentTextIcon}>Appointments</MobileNavLinkItem>
            )}
            {/* Add more mobile nav links here */}

            {user ? (
              <>
                <div className="pt-4 pb-2 border-t border-slate-700">
                  <div className="flex items-center px-3 mb-2">
                    <div className="flex-shrink-0">
                      {/* Placeholder for user avatar if you have one */}
                       <UserCircleIcon className="h-10 w-10 rounded-full text-slate-400" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">{user.first_name || user.username}</div>
                      <div className="text-sm font-medium text-slate-400">{user.email} ({user.role_display || user.role})</div>
                    </div>
                  </div>
                  <MobileNavLinkItem to="/profile/me" icon={UserCircleIcon}>My Profile</MobileNavLinkItem>
                  <MobileNavLinkItem to="/profile/settings" icon={CogIcon}>Settings</MobileNavLinkItem>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-3 py-3 text-base font-medium text-slate-200 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" /> {/* Updated Icon */}
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <MobileNavLinkItem to="/login">Login</MobileNavLinkItem>
                <MobileNavLinkItem to="/register">Register</MobileNavLinkItem>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
