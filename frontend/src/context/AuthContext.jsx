import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  const currentPort = window.location.port;
  const isPort3001 = currentPort === '3001';
  const portalMode = isPort3001 ? 'admin' : 'user';

  useEffect(() => {
    const verifySession = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          // If on Admin Port 3001, reject non-admin users
          if (portalMode === 'admin' && userData.role !== 'admin') {
            await authService.logout();
            setUser(null);
          } else {
            setUser(userData);
            localStorage.setItem('logintel_user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifySession();
  }, [portalMode]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    // Port 3001 is exclusively for Administrator
    if (portalMode === 'admin' && data.user?.role !== 'admin') {
      await authService.logout();
      setUser(null);
      throw {
        response: {
          data: {
            detail: 'Access Denied: Administrative credentials required for this gateway.'
          }
        }
      };
    }
    setUser(data.user);
    return data;
  };

  const register = async (email, password, fullName, username) => {
    // If on Admin Port 3001, public registration is disallowed
    if (portalMode === 'admin') {
      throw {
        response: {
          data: {
            detail: 'Account registration is disabled on this administrative gateway.'
          }
        }
      };
    }
    const data = await authService.register(email, password, fullName, username);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isUser = () => ['user', 'security_analyst', 'viewer', 'admin'].includes(user?.role);
  const isAnalyst = () => ['security_analyst', 'user', 'admin'].includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        portalMode,
        isPort3001,
        currentPort,
        login,
        register,
        logout,
        isAdmin,
        isUser,
        isAnalyst,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
