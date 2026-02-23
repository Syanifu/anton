'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProfileContextType {
    profilePicture: string;
    userName: string;
    userEmail: string;
    updateProfilePicture: (newPicture: string) => void;
    updateUserName: (name: string) => void;
    updateUserEmail: (email: string) => void;
}

const defaultAvatar = "https://i.pravatar.cc/150?u=anton";

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profilePicture, setProfilePicture] = useState<string>(defaultAvatar);
    const [userName, setUserName] = useState<string>('Anton User');
    const [userEmail, setUserEmail] = useState<string>('freelancer@anton.ai');

    // Load from localStorage on mount
    useEffect(() => {
        const savedPicture = localStorage.getItem('profile_picture');
        const savedName = localStorage.getItem('profile_name');
        const savedEmail = localStorage.getItem('profile_email');

        if (savedPicture) setProfilePicture(savedPicture);
        if (savedName) setUserName(savedName);
        if (savedEmail) setUserEmail(savedEmail);
    }, []);

    const updateProfilePicture = (newPicture: string) => {
        setProfilePicture(newPicture);
        localStorage.setItem('profile_picture', newPicture);
    };

    const updateUserName = (name: string) => {
        setUserName(name);
        localStorage.setItem('profile_name', name);
    };

    const updateUserEmail = (email: string) => {
        setUserEmail(email);
        localStorage.setItem('profile_email', email);
    };

    return (
        <ProfileContext.Provider value={{
            profilePicture,
            userName,
            userEmail,
            updateProfilePicture,
            updateUserName,
            updateUserEmail
        }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
