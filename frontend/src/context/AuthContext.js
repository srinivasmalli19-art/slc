import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setApiBase } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('slc_token');
    const storedUser = localStorage.getItem('slc_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('slc_token');
        localStorage.removeItem('slc_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (phone, password, role) => {
    // Ensure backend base is detected/selected before calls
    if (!authAPI._baseURLChecked) {
      // Candidate backends to probe for a `/test` health endpoint
      const candidates = [
        process.env.REACT_APP_BACKEND_URL,
        'https://api.slcvet.com',
        'https://slc-1.onrender.com',
        'http://localhost:8000'
      ].filter(Boolean);

      for (const c of candidates) {
        try {
          const url = c.replace(/\/$/, '') + '/test';
          const res = await fetch(url, { method: 'GET', mode: 'cors' });
          if (res.ok) {
            setApiBase(c);
            authAPI._baseURLChecked = true;
            break;
          }
        } catch (e) {
          // ignore and try next
        }
      }

      if (!authAPI._baseURLChecked) {
        // mark checked to avoid repeating
        authAPI._baseURLChecked = true;
      }
    }
    try {
      setError(null);
      const response = await authAPI.login({ phone, password, role });
      const { access_token, user: userData } = response.data || {};

      // Defensive: ensure we received a proper user object
      if (!access_token || !userData || !userData.name) {
        const msg = response?.data?.detail || 'Invalid login response from server';
        setError(msg);
        throw new Error(msg);
      }

      localStorage.setItem('slc_token', access_token);
      localStorage.setItem('slc_user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('slc_token');
    localStorage.removeItem('slc_user');
    setUser(null);
  };

  const guestLogin = async () => {
    try {
      setError(null);
      const response = await authAPI.guestSession();
      const { access_token, guest_id } = response.data;
      
      const guestUser = {
        id: guest_id,
        name: 'Guest User',
        role: 'guest',
        phone: 'guest'
      };
      
      localStorage.setItem('slc_token', access_token);
      localStorage.setItem('slc_user', JSON.stringify(guestUser));
      setUser(guestUser);
      
      return guestUser;
    } catch (err) {
      const message = err.response?.data?.detail || 'Guest session failed';
      setError(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    guestLogin,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVet: user?.role === 'veterinarian',
    isFarmer: user?.role === 'farmer',
    isParavet: user?.role === 'paravet',
    isGuest: user?.role === 'guest'
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
