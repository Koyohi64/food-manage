"use client";

import Link from "next/link";
import { useEffect } from "react";
import AppShell from "@/app/_components/AppShell";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { useHistory } from "@/lib/hooks/useHistory";
import { useAuthContext } from "@/lib/context/AuthContext";
import { type Ingredient, type CookingLog } from "@/lib/api";

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const ingredients = useIngredients();
  const history = useHistory();

  useEffect(() => {
    if (isAuthenticated) {
      void ingredients.methods.list({ expiringWithinDays: 7, sort: "expiry_asc", limit: 10 });
      void history.methods.list({ limit: 3 });
    }
  }, [isAuthenticated]);

  const expiringItems = ingredients.list.data || [];
  const recentHistory = history.list.data || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysUntilExpiry = (deadline: string | null) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const expiredOrSoonCount = expiringItems.filter((item) => {
    const days = getDaysUntilExpiry(item.deadline);
    return days !== null && days <= 3;
  }).length;

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-8">
          <p>読み込み中...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">概要</p>
            <h2 className="text-2xl font-semibold">ダッシュボード</h2>
          </div>
          <Link
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
            href="/recipes/new"
          >
            レシピ作成
          </Link>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              今日
            </p>
            <p className="mt-4 text-3xl font-semibold">
              {today.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              今日は食材を優先して使いましょう。
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              期限間近
            </p>
            <p className="mt-4 text-3xl font-semibold">
              {ingredients.list.loading ? "…" : `${expiredOrSoonCount}件`}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              これらでレシピを考えましょう。
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              在庫食材
            </p>
            <p className="mt-4 text-3xl font-semibold">
              {ingredients.list.loading ? "…" : `${expiringItems.length}件`}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              （期限7日以内）
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">期限が近い食材</h3>
              <Link
                className="text-sm font-medium text-primary transition hover:text-primary/80"
                href="/ingredients"
              >
                一覧を見る
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {ingredients.list.loading ? (
                <p className="text-sm text-on-surface-variant">読み込み中...</p>
              ) : expiringItems.length === 0 ? (
                <p className="text-sm text-on-surface-variant">期限が近い食材はありません</p>
              ) : (
                expiringItems.map((item: Ingredient) => {
                  const days = getDaysUntilExpiry(item.deadline);
                  const isUrgent = days !== null && days <= 3;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.quantity !== null
                            ? `${item.quantity}${item.unit ?? ""}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isUrgent
                            ? "bg-error-container text-on-error-container"
                            : "bg-secondary-container text-on-secondary-container"
                        }`}
                      >
                        {days !== null
                          ? days <= 0
                            ? "期限切れ"
                            : `あと${days}日`
                          : "無期限"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">最近の料理</h3>
            <div className="mt-4 space-y-3">
              {history.list.loading ? (
                <p className="text-sm text-on-surface-variant">読み込み中...</p>
              ) : recentHistory.length === 0 ? (
                <p className="text-sm text-on-surface-variant">料理履歴がありません</p>
              ) : (
                recentHistory.map((entry: CookingLog) => (
                  <Link
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 transition hover:bg-surface-container"
                    href={entry.recipeId ? `/recipes/${entry.recipeId}` : "/recipes"}
                  >
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(entry.cookedAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary">開く</span>
                  </Link>
                ))
              )}
            </div>
            <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
              <p className="text-sm font-medium">AIレシピを試してみませんか？</p>
              <p className="text-xs text-on-surface-variant">
                食材を選んでAIがレシピを提案します。
              </p>
              <Link
                className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
                href="/recipes/new"
              >
                レシピ生成
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
