import React, { createContext, useContext, useEffect, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // decode token payload (simple base64 decode, no verification)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, role: payload.role, name: payload.name, city: payload.city, gender: payload.gender, token });
      } catch (e) {
        console.error('Invalid token', e);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || data.message || 'Login failed');
      err.response = { data };
      throw err;
    }
    const { token } = data;
    localStorage.setItem('token', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ id: payload.sub, email: payload.email, role: payload.role, name: payload.name, city: payload.city, gender: payload.gender, token });
    return data;
  };

  const signup = async (email, password, role, name, city, gender, maxActiveClients) => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, name, city, gender, maxActiveClients }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || data.message || 'Signup failed');
      err.response = { data };
      throw err;
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

