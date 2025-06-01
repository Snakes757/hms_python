// src/components/auth/ResetPasswordForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { confirmPasswordReset } from '../../api/auth'; // Assuming API function exists

const ResetPasswordForm = () => {
  const { uid, token } = useParams(); // Get uid and token from URL params if route is /reset-password/:uid/:token/
  const navigate = useNavigate();
  const location = useLocation(); // To get query params if token/uid are there

  const [formData, setFormData] = useState({
    new_password1: '',
    new_password2: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Attempt to get uid and token from query parameters as a fallback or primary method
  const [actualUid, setActualUid] = useState(uid);
  const [actualToken, setActualToken] = useState(token);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryUid = queryParams.get('uidb64'); // Example query param names
    const queryToken = queryParams.get('token');
    if (queryUid && !uid) setActualUid(queryUid);
    if (queryToken && !token) setActualToken(queryToken);
  }, [location.search, uid, token]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!actualUid || !actualToken) {
      setError("Password reset token or user identifier is missing. Please use the link from your email.");
      return;
    }

    if (formData.new_password1 !== formData.new_password2) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.new_password1.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      // Pass uid and token to API
      const response = await confirmPasswordReset(actualUid, actualToken, formData.new_password1, formData.new_password2);
      setMessage(response.message || "Password has been reset successfully. You can now log in.");
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Reset Password</h2>
              {!actualUid || !actualToken ? (
                <div className="alert alert-warning">
                  User ID or token not found in URL. Please ensure you're using the correct link from your email.
                </div>
              ) : (
                <>
                  {message && <div className="alert alert-success" role="alert">{message}</div>}
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  {!message && ( // Hide form after success message
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label htmlFor="new_password1" className="form-label">New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          id="new_password1"
                          name="new_password1"
                          value={formData.new_password1}
                          onChange={handleChange}
                          required
                          minLength="10"
                          disabled={isLoading}
                        />
                         <div className="form-text">Must be at least 10 characters.</div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="new_password2" className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          id="new_password2"
                          name="new_password2"
                          value={formData.new_password2}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </form>
                  )}
                </>
              )}
               <div className="text-center mt-3">
                <Link to="/login">Back to Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
