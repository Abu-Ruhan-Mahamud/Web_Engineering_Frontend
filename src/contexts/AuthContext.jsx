import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // M-4: Validate token against server on startup
  useEffect(() => {
    const validateSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me/');
        const userData = res.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch {
        // Token invalid/expired — clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // M-5: Listen for forced-logout events from API 401 interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register/', data);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const googleLogin = async (credential) => {
    const response = await api.post('/auth/google-login/', { credential });
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout/');
      }
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  // C-3: updateUser merges new data into existing user (preserves fields not in the update)
  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      const merged = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
