import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { usersApi } from "../api";

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { user: authUser, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser && token) {
        setLoadingProfile(true);
        setProfileError(null);
        try {
          let userDetails;
          if (authUser.role === "ADMIN" && authUser.id) {
            userDetails = await usersApi.getUserById(authUser.id);
          } else {
            userDetails = await usersApi.authApi.getUserProfile();
          }
          setProfile(userDetails);
        } catch (error) {
          console.error("Failed to fetch user profile in UserContext:", error);
          setProfileError(error.message || "Could not load profile.");
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setProfile(null);
      }
    };

    fetchUserProfile();
  }, [authUser, token]);

  const updateUserSpecificProfile = async (userId, profileData, role) => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      let updatedProfile;
      if (role === "PATIENT") {
        updatedProfile = await usersApi.patientsApi.updatePatientByUserId(
          userId,
          profileData
        );
      } else {
        updatedProfile = await usersApi.updateUserById(userId, profileData);
      }
      setProfile((prevProfile) => ({ ...prevProfile, ...updatedProfile }));
      return updatedProfile;
    } catch (error) {
      console.error("Failed to update user-specific profile:", error);
      setProfileError(error.message || "Could not update profile.");
      throw error;
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
        updateUserSpecificProfile,
        setProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
