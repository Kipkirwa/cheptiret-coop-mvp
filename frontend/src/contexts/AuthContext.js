import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from storage on app start
    const loadUser = () => {
      const storedUser = authService.getCurrentUser();
      console.log('🔄 Loading stored user:', storedUser);
      if (storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);

  const farmerLogin = async (phone, pin) => {
    setLoading(true);
    const result = await authService.farmerLogin(phone, pin);
    if (result.success) {
      console.log('✅ Setting user after login:', result.user);
      setUser(result.user);
    }
    setLoading(false);
    return result;
  };

  const transporterLogin = async (username, password) => {
    setLoading(true);
    const result = await authService.transporterLogin(username, password);
    if (result.success) {
      setUser(result.user);
    }
    setLoading(false);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  const getUserRole = () => {
  const role = authService.getUserRole();
  console.log('📌 AuthContext.getUserRole() returning:', role);
  return role;
};

  const value = {
    user,
    loading,
    farmerLogin,
    transporterLogin,
    logout,
    isAuthenticated,
    getUserRole,
    isFarmer: () => authService.isFarmer(),
    isTransporter: () => authService.isTransporter(),
    isAdmin: () => authService.isAdmin(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;