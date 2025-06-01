// src/components/common/Header.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { logoutUser } from '../../api/auth'; // Assuming logoutUser clears localStorage

const Header = () => {
  const { user, setUser, setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(); // API call to backend (optional, primarily for server-side session invalidation)
      setUser(null);
      setToken(null);
      // localStorage.removeItem('authToken'); // Redundant if logoutUser and AuthContext handle it
      // localStorage.removeItem('userData');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still attempt to clear client-side auth state
      setUser(null);
      setToken(null);
      navigate('/login');
    }
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">HMS</Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              {user && user.role === 'ADMIN' && ( // Example admin-only link
                <li className="nav-item">
                  <Link className="nav-link" to="/admin/dashboard">Admin Dashboard</Link>
                </li>
              )}
               {user && (user.role === 'DOCTOR' || user.role === 'NURSE') && (
                <li className="nav-item">
                  <Link className="nav-link" to="/patients">Patients</Link>
                </li>
              )}
            </ul>
            <ul className="navbar-nav">
              {user ? (
                <>
                  <li className="nav-item">
                    <span className="navbar-text me-3">
                      Welcome, {user.first_name || user.username} ({user.role})
                    </span>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/profile/me">My Profile</Link>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-outline-light" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Register</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
