// src/api/auth.js
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
    if (data.token && data.user) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
    } else {
      // console.warn('Login response missing token or user data:', data); // [Source 66]
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

  // Always clear local storage for logout regardless of API call success
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');

  if (!token) {
    // console.log("Already logged out or no token found locally."); // [Source 70]
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
    if (!response.ok) {
      // console.warn(`Logout request to server failed: ${response.status}. Client-side logout still performed.`); // [Source 72]
      // Even if server fails, client-side is already logged out.
    }
    return { message: "Logout successful." };
  } catch (error) {
    console.error('Logout API call failed:', error);
    // Client-side logout has already occurred.
    return { message: "Logout completed locally, server call failed." };
  }
};

export const getUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return Promise.reject(new Error("No authentication token found."));
  }

  try {
    // Corrected URL: Removed '/me'
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        // Consider redirecting to login or notifying AuthContext to update state
      }
      throw new Error(errorData.detail || JSON.stringify(errorData) || `HTTP error! status: ${response.status}`);
    }
    const profileData = await response.json();
    localStorage.setItem('userData', JSON.stringify(profileData)); // Update user data in local storage
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
    // Corrected URL: Removed '/me'
    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'PUT', // Or PATCH if your backend supports partial updates with PATCH
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
    localStorage.setItem('userData', JSON.stringify(updatedUser)); // Update user data in local storage
    return updatedUser;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};

// Mocked password reset functions - replace with actual API calls when backend is ready
export const requestPasswordReset = async (email) => {
  // Simulating API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "test@example.com" || email.includes('@')) { // [Source 90]
        console.log(`Simulating password reset request for ${email}`); // [Source 90]
        resolve({ message: "If an account with this email exists, a password reset link has been sent." }); // [Source 90]
      } else {
        reject(new Error("Invalid email format for password reset simulation.")); // [Source 90]
      }
    }, 1000); // [Source 91]
  });
};

export const confirmPasswordReset = async (uid, token, new_password1, new_password2) => {
  // Simulating API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (new_password1 === new_password2 && new_password1.length >= 10 && token && uid) { // [Source 91]
        console.log(`Simulating password reset confirmation for uid: ${uid}`); // [Source 91]
        resolve({ message: "Password has been reset successfully. You can now log in with your new password." }); // [Source 91]
      } else if (new_password1 !== new_password2) { // [Source 91]
        reject(new Error("Passwords do not match.")); // [Source 92]
      } else {
        reject(new Error("Password reset confirmation failed (simulated). Ensure token, uid, and valid passwords.")); // [Source 92]
      }
    }, 1000); // [Source 92]
  });
};
