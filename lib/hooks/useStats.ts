"use client";

import { useCallback, useEffect, useState } from "react";
import { statsApi, type Stats } from "@/lib/api";

export function useStats() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await statsApi.get();
      setData(result);
    } catch {
      // サイドバーなので失敗しても無視
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, refresh: fetch };
}
