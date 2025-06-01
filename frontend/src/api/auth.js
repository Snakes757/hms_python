// src/api/auth.js

// Corrected: Use import.meta.env for Vite environment variables
// Ensure you have a .env file in your frontend project root with VITE_API_BASE_URL defined
// Example .env content: VITE_API_BASE_URL=/api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.token && data.user) { // Ensure user data is also present
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
    } else {
      // Handle cases where token or user might be missing in response
      console.warn('Login response missing token or user data:', data);
      throw new Error('Login successful, but token or user data was not received.');
    }
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  const token = localStorage.getItem('authToken');

  // Always clear local storage for logout
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');

  if (!token) {
    // No token, so user wasn't logged in or already logged out client-side
    return Promise.resolve({ message: "Already logged out or no token found." });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    // Even if the server call fails, the client-side logout is already done.
    if (!response.ok) {
      console.warn(`Logout request to server failed: ${response.status}. Client-side logout still performed.`);
      // Optionally, you could throw an error here if server confirmation is critical,
      // but for logout, client-side clearing is often sufficient.
    }
    return { message: "Logout successful." };
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Client-side logout is already done.
    return { message: "Logout completed locally, server call failed." };
  }
};

export const getUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile/me/`, { // Ensure endpoint matches backend (often /me/ for profile)
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      if (response.status === 401) { // Handle unauthorized specifically
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        // Optionally redirect to login or notify user
      }
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    const profileData = await response.json();
    localStorage.setItem('userData', JSON.stringify(profileData)); // Update stored user data
    return profileData;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found."));
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile/me/`, { // Ensure endpoint matches backend
      method: 'PUT', // Or PATCH depending on your backend API design
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    const updatedUser = await response.json();
    localStorage.setItem('userData', JSON.stringify(updatedUser)); // Update stored user data
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};


// --- Password Reset (Simulated - Replace with actual API calls) ---
export const requestPasswordReset = async (email) => {
  // This is a placeholder. Replace with your actual API call.
  // Example:
  // const response = await fetch(`${API_BASE_URL}/users/password-reset/`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email }),
  // });
  // if (!response.ok) throw new Error('Password reset request failed');
  // return response.json();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "test@example.com" || email.includes('@')) { // Basic email check for simulation
        console.log(`Simulating password reset request for ${email}`);
        resolve({ message: "If an account with this email exists, a password reset link has been sent." });
      } else {
        reject(new Error("Invalid email format for password reset simulation."));
      }
    }, 1000);
  });
};

export const confirmPasswordReset = async (uid, token, new_password1, new_password2) => {
  // This is a placeholder. Replace with your actual API call.
  // Example:
  // const response = await fetch(`${API_BASE_URL}/users/password-reset/confirm/`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ uid, token, new_password1, new_password2 }),
  // });
  // if (!response.ok) throw new Error('Password reset confirmation failed');
  // return response.json();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (new_password1 === new_password2 && new_password1.length >= 10 && token && uid) {
        console.log(`Simulating password reset confirmation for uid: ${uid}`);
        resolve({ message: "Password has been reset successfully. You can now log in with your new password." });
      } else if (new_password1 !== new_password2) {
        reject(new Error("Passwords do not match."));
      } else {
        reject(new Error("Password reset confirmation failed (simulated). Ensure token, uid, and valid passwords."));
      }
    }, 1000);
  });
};
