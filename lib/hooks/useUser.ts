"use client";

import { useCallback, useMemo, useState } from "react";
import { userApi, type UserProfile, type UserSettings } from "@/lib/api";
import { useAsync } from "./useAsync";

export function useUser() {
  const { state: profileState, execute: loadProfile } = useAsync<UserProfile>(null);
  const { state: settingsState, execute: loadSettings } = useAsync<UserSettings>(null);
  const [error, setError] = useState<Error | null>(null);

  const getProfile = useCallback(async () => {
    try {
      return await loadProfile(() => userApi.getProfile());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (data: Parameters<typeof userApi.updateProfile>[0]) => {
      try {
        const profile = await userApi.updateProfile(data);
        setError(null);
        return profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const deleteProfile = useCallback(async (password: string) => {
    try {
      await userApi.deleteProfile(password);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const getSettings = useCallback(async () => {
    try {
      return await loadSettings(() => userApi.getSettings());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (data: Partial<UserSettings>) => {
      try {
        const settings = await userApi.updateSettings(data);
        setError(null);
        return settings;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const methods = useMemo(
    () => ({ getProfile, updateProfile, deleteProfile, getSettings, updateSettings }),
    [getProfile, updateProfile, deleteProfile, getSettings, updateSettings]
  );

  return { profile: profileState, settings: settingsState, error, methods };
}
