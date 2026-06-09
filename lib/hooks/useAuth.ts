"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi, User, SignupInput, LoginInput } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const session = await authApi.getSession();
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    setError(null);
    try {
      const session = await authApi.signup(input);
      setUser(session.user);
      return session.user;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setError(null);
    try {
      const session = await authApi.login(input);
      setUser(session.user);
      return session.user;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setError(null);
    try {
      return await authApi.requestPasswordReset(email);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setError(null);
    try {
      return await authApi.resetPassword(token, newPassword);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    signup,
    login,
    logout,
    checkSession,
    requestPasswordReset,
    resetPassword,
  };
}
