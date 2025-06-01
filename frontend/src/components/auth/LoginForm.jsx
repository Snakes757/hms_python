// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { loginUser } from '../../api/auth';
// import { useNavigate } from 'react-router-dom'; // Uncomment if using React Router for navigation

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const navigate = useNavigate(); // Uncomment for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Email and password are required.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await loginUser({ email, password });
      setSuccess(`Login successful! Welcome ${data.user.first_name || data.user.username}.`);
      // console.log('Login successful:', data);
      // TODO: Redirect user or update auth state in context
      // navigate('/dashboard'); // Example navigation
      // For now, just clear form
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
              <h2 className="card-title text-center mb-4">Login</h2>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              {success && <div className="alert alert-success" role="alert">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="passwordInput" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span className="visually-hidden">Loading...</span>
                      {' '}Logging in...
                    </>
                  ) : 'Login'}
                </button>
              </form>
              {/* Optional: Add links for registration or password reset */}
              <div className="text-center mt-3">
                <p>
                  Don't have an account? <a href="/register">Register here</a>
                </p>
                {/* <p>
                  <a href="/forgot-password">Forgot password?</a>
                </p> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
