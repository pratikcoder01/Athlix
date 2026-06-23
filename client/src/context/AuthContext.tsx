import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export interface UserContextType {
  id: string;
  name: string;
  email: string;
  role: 'athlete' | 'coach' | 'academy_owner' | 'tournament_organizer' | 'admin';
  profileImage?: string;
  bio?: string;
  discipline?: string;
  beltRank?: string;
}

interface AuthContextProps {
  user: UserContextType | null;
  loading: boolean;
  signup: (
    name: string,
    email: string,
    password: string,
    role: string,
    discipline: string,
    beltRank: string
  ) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfileState: (updatedUser: UserContextType) => void;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: string,
    discipline: string,
    beltRank: string
  ) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        discipline,
        beltRank,
      });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: 'Registration failed' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: 'Login failed' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfileState = (updatedUser: UserContextType) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        updateProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
