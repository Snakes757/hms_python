// src/pages/Unauthorized.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container text-center mt-5 pt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <h1 className="display-1 text-warning fw-bold">403</h1>
              <h2 className="mb-4">Access Denied</h2>
              <p className="lead text-muted mb-4">
                Oops! You do not have permission to access this page.
              </p>
              <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-lg px-4 me-sm-3">
                  Go Back
                </button>
                <Link to="/" className="btn btn-primary btn-lg px-4">
                  Go to Homepage
                </Link>
              </div>
            </div>
            <div className="card-footer text-muted small">
              If you believe you should have access, please contact an administrator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
