"use client";

import { useCallback, useMemo, useState } from "react";
import { recipesApi, type Recipe, type RecipeCreateInput, type CookingLog } from "@/lib/api";
import { useAsync } from "./useAsync";

export function useRecipes() {
  const { state: listState, execute: loadList } = useAsync<Recipe[]>(null);
  const { state: itemState, execute: loadItem } = useAsync<Recipe>(null);
  const [error, setError] = useState<Error | null>(null);

  const list = useCallback(
    async (params?: { page?: number; limit?: number; search?: string; sort?: string }) => {
      try {
        return await loadList(() => recipesApi.list(params));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [loadList]
  );

  const create = useCallback(async (data: RecipeCreateInput) => {
    try {
      const item = await recipesApi.create(data);
      setError(null);
      return item;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const get = useCallback(async (id: string) => {
    try {
      return await loadItem(() => recipesApi.get(id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [loadItem]);

  const update = useCallback(async (id: string, data: RecipeCreateInput) => {
    try {
      const item = await recipesApi.update(id, data);
      setError(null);
      return item;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const delete_ = useCallback(async (id: string) => {
    try {
      await recipesApi.delete(id);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const getHistory = useCallback(
    async (id: string, params?: { page?: number; limit?: number }) => {
      try {
        return await recipesApi.getHistory(id, params);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const aiGenerate = useCallback(
    async (params: Parameters<typeof recipesApi.aiGenerate>[0]) => {
      try {
        const content = await recipesApi.aiGenerate(params);
        setError(null);
        return content;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const methods = useMemo(
    () => ({ list, create, get, update, delete: delete_, getHistory, aiGenerate }),
    [list, create, get, update, delete_, getHistory, aiGenerate]
  );

  const reload = useCallback(() => list(), [list]);

  return { list: listState, item: itemState, error, methods, reload };
}
