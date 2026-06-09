"use client";

import { useCallback, useMemo, useState } from "react";
import { ingredientsApi, type Ingredient, type IngredientCreate } from "@/lib/api";
import { useAsync } from "./useAsync";

export function useIngredients() {
  const { state: listState, execute: loadList } = useAsync<Ingredient[]>(null);
  const { state: itemState, execute: loadItem } = useAsync<Ingredient>(null);
  const [error, setError] = useState<Error | null>(null);

  const list = useCallback(
    async (params?: {
      search?: string;
      sort?: string;
      page?: number;
      limit?: number;
      expiringWithinDays?: number;
    }) => {
      try {
        return await loadList(() => ingredientsApi.list(params));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [loadList]
  );

  const create = useCallback(
    async (items: IngredientCreate[]) => {
      try {
        const result = await ingredientsApi.create(items);
        setError(null);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const get = useCallback(async (id: string) => {
    try {
      return await loadItem(() => ingredientsApi.get(id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, [loadItem]);

  const update = useCallback(
    async (id: string, data: Parameters<typeof ingredientsApi.update>[1]) => {
      try {
        const item = await ingredientsApi.update(id, data);
        setError(null);
        return item;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const delete_ = useCallback(async (id: string) => {
    try {
      await ingredientsApi.delete(id);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const analyzeReceipt = useCallback(async (file: File) => {
    try {
      const result = await ingredientsApi.analyzeReceipt(file);
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const analyzeFridge = useCallback(async (file: File) => {
    try {
      const result = await ingredientsApi.analyzeFridge(file);
      setError(null);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const methods = useMemo(
    () => ({ list, create, get, update, delete: delete_, analyzeReceipt, analyzeFridge }),
    [list, create, get, update, delete_, analyzeReceipt, analyzeFridge]
  );

  const reload = useCallback(() => list(), [list]);

  return { list: listState, item: itemState, error, methods, reload };
}
