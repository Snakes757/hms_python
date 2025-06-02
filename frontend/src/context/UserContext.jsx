import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { authApi, usersApi } from "../api"; // Import authApi directly

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { user: authUser, token, loading: authLoading } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser && token && !authLoading) { // Ensure auth is not loading
        setLoadingProfile(true);
        setProfileError(null);
        try {
          // Use authApi directly for getUserProfile
          const userDetails = await authApi.getUserProfile();
          setProfile(userDetails);
          // Store in localStorage if not already handled by AuthContext's initial load
          localStorage.setItem('userData', JSON.stringify(userDetails));
        } catch (error) {
          console.error("Failed to fetch user profile in UserContext:", error);
          setProfileError(error.message || "Could not load profile.");
          // If profile fetch fails, ensure local storage is consistent
          // localStorage.removeItem('authToken'); // Potentially logout if token is invalid
          // localStorage.removeItem('userData');
          // setProfile(null); // Clear profile
        } finally {
          setLoadingProfile(false);
        }
      } else if (!authUser && !token && !authLoading) { // If no authUser and no token, and auth is done loading
        setProfile(null); // Clear profile if not authenticated
        setLoadingProfile(false);
      }
      // If authLoading is true, UserContext will wait for AuthContext to finish
    };

    fetchUserProfile();
  }, [authUser, token, authLoading]); // Add authLoading to dependencies

  const updateUserSpecificProfile = async (userId, profileDataToUpdate, role) => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      let updatedProfileData;
      // The backend API for updating user details (first_name, last_name, username)
      // is typically separate from updating role-specific profiles (PatientProfile, DoctorProfile, etc.)
      // We might need two API calls or a backend that handles nested updates.

      // For now, assuming updateUserById handles general user fields (first_name, last_name, username)
      // and role-specific profile data is handled by a different mechanism or nested within the main user update.
      // The current usersApi.updateUserById seems to be for admin use.
      // For a user updating their own profile, it's usually via /users/profile/me/ (PUT/PATCH)

      // Let's assume authApi.updateUserProfile handles the general user fields
      // And specific profile updates are handled by their respective APIs if they exist,
      // or the backend handles nested updates via the main profile endpoint.

      const generalProfileUpdate = {
        first_name: profileDataToUpdate.first_name,
        last_name: profileDataToUpdate.last_name,
        username: profileDataToUpdate.username,
        // email is usually not updatable or has a separate process
      };
      
      // Update general user info (first_name, last_name, username)
      const updatedUser = await authApi.updateUserProfile(generalProfileUpdate);

      let roleSpecificUpdatedData = {};
      // Then update role-specific profile if applicable
      if (role === "PATIENT" && profileDataToUpdate.patient_profile) {
         // Assuming patientsApi.updatePatientByUserId updates the Patient model instance
        roleSpecificUpdatedData = await usersApi.patientsApi.updatePatientByUserId(
          userId, // or authUser.id
          profileDataToUpdate.patient_profile
        );
      } else if (role === "DOCTOR" && profileDataToUpdate.doctor_profile) {
        // This part needs clarification on how doctor_profile is updated.
        // If it's part of the main user object update:
        // await authApi.updateUserProfile({ doctor_profile: profileDataToUpdate.doctor_profile });
        // Or if it's a separate endpoint:
        // await usersApi.doctorsApi.updateDoctorProfile(userId, profileDataToUpdate.doctor_profile); (example, assuming doctorsApi exists)
        console.warn("Doctor profile update logic needs to be clarified based on API structure.");
      } else if (role === "NURSE" && profileDataToUpdate.nurse_profile) {
        console.warn("Nurse profile update logic needs to be clarified based on API structure.");
      }
      
      // Refresh the entire profile from the server to ensure consistency
      const refreshedProfile = await authApi.getUserProfile();
      setProfile(refreshedProfile);
      localStorage.setItem('userData', JSON.stringify(refreshedProfile)); // Update localStorage

      return refreshedProfile;
    } catch (error) {
      console.error("Failed to update user-specific profile:", error);
      setProfileError(error.message || "Could not update profile.");
      throw error; // Re-throw to be caught by the calling component
    } finally {
      setLoadingProfile(false);
    }
  };


  return (
    <UserContext.Provider
      value={{
        profile,
        loadingProfile,
        profileError,
        updateUserSpecificProfile, // Expose this function
        setProfile, // Allow direct setting if needed, e.g., after login
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
