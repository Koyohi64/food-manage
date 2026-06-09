"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { User } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
  signup: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  login: (input: { email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const value: AuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    signup: auth.signup,
    login: auth.login,
    logout: auth.logout,
    checkSession: auth.checkSession,
    requestPasswordReset: auth.requestPasswordReset,
    resetPassword: auth.resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
