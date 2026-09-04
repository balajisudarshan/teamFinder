import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('teamfinder_token'));
  const [loading, setLoading] = useState(true);

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/profile');
        if (res.data?.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  // Active sync: Poll every 4s and listen for focus/flag events so logged-in users are alerted immediately if flagged
  useEffect(() => {
    if (!token) return;

    const syncStatus = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (res.data?.success) {
          setUser((prev) => {
            const next = res.data.user;
            // Only trigger state update if flag state, team flag state, or details changed
            if (
              !prev ||
              prev.isFlagged !== next.isFlagged ||
              prev.flagReason !== next.flagReason ||
              prev.team?.isFlagged !== next.team?.isFlagged ||
              prev.team?.flagReason !== next.team?.flagReason
            ) {
              return next;
            }
            return prev;
          });
        }
      } catch {
        // Silently ignore background polling errors
      }
    };

    const intervalId = setInterval(syncStatus, 4000);
    const onFocus = () => syncStatus();
    const onFlagEvent = () => syncStatus();

    window.addEventListener('focus', onFocus);
    window.addEventListener('account-flagged', onFlagEvent);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('account-flagged', onFlagEvent);
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('teamfinder_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (userData) => {
    // Frontend domain verification
    const email = userData.email?.trim().toLowerCase() || '';
    if (!email.endsWith('@nbkrist.org')) {
      throw new Error('Registration is strictly restricted to NBKRIST students. Email must end with @nbkrist.org');
    }

    const res = await api.post('/auth/register', userData);
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('teamfinder_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('teamfinder_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data?.success) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Failed to update profile');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/profile');
      if (res.data?.success) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message);
    }
  };

  const isUserFlagged = Boolean(user?.isFlagged);
  const isTeamFlagged = Boolean(user?.team?.isFlagged);
  const hasActiveFlag = isUserFlagged || isTeamFlagged;
  const activeFlagReason = isUserFlagged
    ? user?.flagReason
    : isTeamFlagged
    ? user?.team?.flagReason
    : '';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isFlagged: isUserFlagged,
        flagReason: user?.flagReason || '',
        flaggedAt: user?.flaggedAt || null,
        isTeamFlagged,
        teamFlagReason: user?.team?.flagReason || '',
        flaggedTeamName: user?.team?.teamName || '',
        hasActiveFlag,
        activeFlagReason,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
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
