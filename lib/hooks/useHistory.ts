"use client";

import { useCallback, useMemo, useState } from "react";
import { historyApi, type CookingLog, type ConsumedIngredientInput } from "@/lib/api";
import { useAsync } from "./useAsync";

export function useHistory() {
  const { state: listState, execute: loadList } = useAsync<CookingLog[]>(null);
  const [error, setError] = useState<Error | null>(null);

  const list = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      try {
        return await loadList(() => historyApi.list(params));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [loadList]
  );

  const create = useCallback(
    async (data: { recipeId: string; consumedIngredients: ConsumedIngredientInput[] }) => {
      try {
        const log = await historyApi.create(data);
        setError(null);
        return log;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const methods = useMemo(() => ({ list, create }), [list, create]);
  const reload = useCallback(() => list(), [list]);

  return { list: listState, error, methods, reload };
}
