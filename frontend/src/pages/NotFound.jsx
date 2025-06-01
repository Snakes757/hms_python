// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container text-center mt-5 pt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <h1 className="display-1 text-primary fw-bold">404</h1>
              <h2 className="mb-4">Page Not Found</h2>
              <p className="lead text-muted mb-4">
                Oops! The page you are looking for does not exist. It might have been moved or deleted.
              </p>
              <Link to="/" className="btn btn-primary btn-lg">
                <i className="bi bi-house-door-fill me-2"></i> Go to Homepage
              </Link>
            </div>
            <div className="card-footer text-muted small">
              If you believe this is an error, please contact support.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
