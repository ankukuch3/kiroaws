import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { authApi, usersApi } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Fetch fresh user data to get updated follower count
      const fetchUserData = async () => {
        try {
          const { user: updatedUser } = await usersApi.getProfile(parsedUser.id, storedToken);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      };
      
      fetchUserData();
    }
    
    setLoading(false);
  }, []);

  const register = async (username: string, email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await authApi.register(username, email, password, displayName);
      
      // After registration, automatically log in
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authApi.login(username, password);
      
      // Save token
      localStorage.setItem('token', data.token);
      
      // Get complete user profile with follower count
      const { user: profileData } = await usersApi.getProfile(data.user.id, data.token);
      
      // Save complete user data
      localStorage.setItem('user', JSON.stringify(profileData));
      
      setToken(data.token);
      setUser(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    isAuthenticated: !!token,
    user,
    token,
    login,
    register,
    logout,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};