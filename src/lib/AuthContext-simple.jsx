/**
 * Zjednodušený AuthContext - nahrazuje Base44 autentizaci
 * Prozatím používá mock auth, později se integruje ConnectKit/Wagmi
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '@/api/mockClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      // Zkontrolovat, zda je uživatel autentizován
      const authenticated = await db.auth.isAuthenticated();
      
      if (authenticated) {
        // Načíst uživatelská data
        const currentUser = await db.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      
      // Pokud auth selže, nastavit error
      setAuthError({
        type: 'auth_required',
        message: 'Authentication required'
      });
    }
  };

  const login = async (credentials) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      const userData = await db.auth.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed'
      });
      setIsLoadingAuth(false);
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      db.auth.logout(window.location.href);
    } else {
      db.auth.logout();
    }
  };

  const navigateToLogin = () => {
    db.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authError,
      login,
      logout,
      navigateToLogin,
      checkUserAuth
    }}>
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