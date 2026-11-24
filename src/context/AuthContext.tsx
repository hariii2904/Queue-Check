import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Role } from '../types';
import { REAL_PROFILES } from '../data/mockData';

interface AuthContextType {
  currentUser: Profile;
  switchRole: (role: Role, hospitalId?: string) => void;
  loginAs: (profileId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  demoProfiles: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PATIENT_PROFILE: Profile = {
  id: 'user-patient',
  full_name: 'Patient (Guest)',
  role: 'patient',
  preferred_language: 'en',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const saved = localStorage.getItem('queuecheck_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_PATIENT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('queuecheck_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchRole = (role: Role, hospitalId?: string) => {
    if (role === 'admin') {
      const adminProf = REAL_PROFILES.find((p: Profile) => p.role === 'admin') || {
        id: 'user-admin',
        full_name: 'Admin QueueCheck (HQ)',
        role: 'admin',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
      };
      setCurrentUser(adminProf);
    } else if (role === 'receptionist') {
      const rec = REAL_PROFILES.find((p: Profile) => (hospitalId ? p.hospital_id === hospitalId : p.role === 'receptionist')) || {
        id: 'user-rec-apollo',
        full_name: 'V. Sumathi (Apollo Greams Reception)',
        role: 'receptionist',
        hospital_id: hospitalId || 'hosp-apollo-greams',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
      };
      setCurrentUser({ ...rec, hospital_id: hospitalId || rec.hospital_id || 'hosp-apollo-greams' });
    } else {
      setCurrentUser(DEFAULT_PATIENT_PROFILE);
    }
  };

  const loginAs = (profileId: string) => {
    const found = REAL_PROFILES.find((p: Profile) => p.id === profileId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    setCurrentUser(DEFAULT_PATIENT_PROFILE);
  };

  const isStaff = currentUser.role === 'receptionist' || currentUser.role === 'admin';
  const isAdmin = currentUser.role === 'admin';
  const isAuthenticated = currentUser.role !== 'patient';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        loginAs,
        logout,
        isAuthenticated,
        isStaff,
        isAdmin,
        demoProfiles: REAL_PROFILES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
