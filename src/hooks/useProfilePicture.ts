import { useState, useEffect } from "react";
import { profilePictureService, ProfilePictureData } from "../services/profilePictureService";

export function useProfilePicture() {
  const [profilePicture, setProfilePicture] = useState<ProfilePictureData | null>(() =>
    profilePictureService.getProfilePicture()
  );

  useEffect(() => {
    // 1. Initialize Firestore real-time listener
    const unsubscribe = profilePictureService.initListener((data) => {
      setProfilePicture(data);
    });

    // 2. Local custom event listener for immediate updates
    const handleUpdate = (e: any) => {
      if (e?.detail !== undefined) {
        setProfilePicture(e.detail);
      } else {
        setProfilePicture(profilePictureService.getProfilePicture());
      }
    };

    window.addEventListener("portfolio_profile_picture_update", handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("portfolio_profile_picture_update", handleUpdate);
    };
  }, []);

  return profilePicture;
}
