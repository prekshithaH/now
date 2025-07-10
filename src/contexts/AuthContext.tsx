import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Patient, Doctor } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'patient' | 'doctor') => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'patient' | 'doctor') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updatePatientProfile: (profileData: Partial<Patient>) => void;
  isProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Check if profile is complete for patients
      if (userData.role === 'patient') {
        const isComplete = userData.profileCompleted === true;
        setIsProfileComplete(isComplete);
      } else {
        setIsProfileComplete(true); // Doctors don't need profile completion
      }
    }
  }, []);

  const login = async (email: string, password: string, role: 'patient' | 'doctor') => {
    // Get existing users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if user exists with this email and role
    const existingUser = existingUsers.find((u: any) => u.email === email && u.role === role);
    
    if (!existingUser) {
      throw new Error('Invalid credentials or user not found');
    }

    // Verify password (in production, this would be properly hashed)
    if (existingUser.password !== password) {
      throw new Error('Invalid password');
    }

    const userData = { ...existingUser };
    delete userData.password; // Remove password from user object

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);

    // Check profile completion for patients
    if (userData.role === 'patient') {
      const isComplete = userData.profileCompleted === true;
      setIsProfileComplete(isComplete);
    } else {
      setIsProfileComplete(true);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'patient' | 'doctor') => {
    // Get existing users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if email already exists for any role
    const emailExists = existingUsers.some((u: any) => u.email === email);
    
    if (emailExists) {
      throw new Error('Email already registered. Please use a different email or try logging in.');
    }

    const newUser: any = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      password, // In production, this would be hashed
    };

    if (role === 'patient') {
      newUser.emergencyContacts = [];
      newUser.healthRecords = [];
      newUser.profileCompleted = false; // Mark as incomplete for new patients
      newUser.doctorId = 'dr-rajesh-001'; // Automatically assign Dr. Rajesh
      newUser.doctorName = 'Dr. Rajesh';
      // Don't set dueDate or currentWeek - let user fill these in profile completion
    } else {
      newUser.specialization = '';
      newUser.license = '';
      newUser.patients = [];
      newUser.profileCompleted = true; // Doctors don't need profile completion
    }

    // Save to registered users
    existingUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

    // Auto-login after signup
    const userDataForSession = { ...newUser };
    delete userDataForSession.password;
    
    setUser(userDataForSession);
    localStorage.setItem('user', JSON.stringify(userDataForSession));
    setIsAuthenticated(true);
    
    if (role === 'patient') {
      setIsProfileComplete(false); // New patients need to complete profile
    } else {
      setIsProfileComplete(true);
    }
  };

  const updatePatientProfile = (profileData: Partial<Patient>) => {
    if (user && user.role === 'patient') {
      const updatedUser = { 
        ...user, 
        ...profileData, 
        profileCompleted: true, // Mark profile as completed
        doctorId: 'dr-rajesh-001', // Ensure Dr. Rajesh is assigned
        doctorName: 'Dr. Rajesh'
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update in registered users as well
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === user.id);
      if (userIndex !== -1) {
        existingUsers[userIndex] = { 
          ...existingUsers[userIndex], 
          ...profileData, 
          profileCompleted: true 
        };
        localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      }
      
      // Profile is now complete
      setIsProfileComplete(true);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsProfileComplete(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isAuthenticated, 
      updatePatientProfile,
      isProfileComplete 
    }}>
      {children}
    </AuthContext.Provider>
  );
};