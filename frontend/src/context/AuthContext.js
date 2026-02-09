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
      // If user previously set a backend URL in localStorage, use it immediately
      try {
        const stored = localStorage.getItem('slc_backend_url');
        if (stored) {
          setApiBase(stored);
          authAPI._baseURLChecked = true;
        }
      } catch (e) {}
      // Candidate backends to probe for a `/test` health endpoint.
      // Avoid probing localhost when the frontend is deployed on a non-localhost origin
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const rawCandidates = [
        process.env.REACT_APP_BACKEND_URL,
        'https://slc-1.onrender.com',
        'https://api.slcvet.com',
        'http://localhost:8000'
      ].filter(Boolean);

      const candidates = rawCandidates.filter((c) => {
        if (!isLocalHost && c.startsWith('http://localhost')) return false;
        return true;
      });

      let found = false;
      for (const c of candidates) {
        try {
          const url = c.replace(/\/$/, '') + '/test';
          const res = await fetch(url, { method: 'GET', mode: 'cors' });
          if (res && res.ok) {
            setApiBase(c);
            authAPI._baseURLChecked = true;
            found = true;
            console.info('[auth] backend autodetect: using', c);
            break;
          }
          // If we get a non-2xx from a static host (e.g., 404) continue trying
        } catch (e) {
          // DNS or network error - continue to next candidate
          console.debug('[auth] backend autodetect failed for', c, e && e.message);
        }
      }

      if (!found) {
        authAPI._baseURLChecked = true;
        console.warn('[auth] backend autodetect did not find a reachable backend. Set REACT_APP_BACKEND_URL in your frontend environment to avoid probing.');
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
