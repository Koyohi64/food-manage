"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useHistory } from "@/lib/hooks/useHistory";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { type Recipe, type CookingLog } from "@/lib/api";

export default function RecipesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const recipes = useRecipes();
  const history = useHistory();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created_desc");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && recipes.list.data === null) {
      void recipes.methods.list({ search, sort });
    }
  }, [isAuthenticated, recipes.list.data, recipes.methods, search, sort]);

  useEffect(() => {
    if (isAuthenticated && history.list.data === null) {
      void history.methods.list({ page: 1, limit: 5 });
    }
  }, [isAuthenticated, history.list.data, history.methods]);

  if (authLoading || !isAuthenticated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center">
          <p>認証中...</p>
        </div>
      </AppShell>
    );
  }

  const recipeList = recipes.list.data || [];
  const historyList = history.list.data || [];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">レシピ</p>
            <h2 className="text-2xl font-semibold">レシピ一覧</h2>
          </div>
          <Link
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
            href="/recipes/new"
          >
            レシピ作成
          </Link>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2">
              <span className="text-xs text-on-surface-variant">検索</span>
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="レシピを検索"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  void recipes.methods.list({ search: e.target.value, sort });
                }}
              />
            </div>
            <select
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                void recipes.methods.list({ search, sort: e.target.value });
              }}
            >
              <option value="created_desc">登録順</option>
              <option value="last_cooked_desc">最近調理した順</option>
              <option value="cook_count_desc">調理回数順</option>
              <option value="name_asc">名前順</option>
            </select>
          </div>

          {recipes.error && (
            <div className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
              {recipes.error.message}
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {recipes.list.loading ? (
              <div className="flex items-center justify-center p-8 md:col-span-3">
                <p>読み込み中...</p>
              </div>
            ) : recipeList.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-on-surface-variant md:col-span-3">
                <p>レシピがありません</p>
              </div>
            ) : (
              recipeList.map((recipe: Recipe) => (
                <Link
                  key={recipe.id}
                  className="flex flex-col gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 transition hover:bg-surface-container"
                  href={`/recipes/${recipe.id}`}
                >
                  <p className="font-semibold">{recipe.name}</p>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span>
                      {recipe.content?.cookingTimeMinutes
                        ? `${recipe.content.cookingTimeMinutes}分`
                        : "—"}
                    </span>
                    {recipe.content?.tags?.[0] && (
                      <span className="rounded-full bg-secondary-container px-2 py-1 font-semibold text-on-secondary-container">
                        {recipe.content.tags[0]}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="text-lg font-semibold">料理履歴</h3>

          {history.error && (
            <div className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
              {history.error.message}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {history.list.loading ? (
              <div className="flex items-center justify-center p-8">
                <p>読み込み中...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-on-surface-variant">
                <p>履歴がありません</p>
              </div>
            ) : (
              historyList.map((entry: CookingLog) => (
                <Link
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                  href={entry.recipeId ? `/recipes/${entry.recipeId}` : "#"}
                >
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(entry.cookedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  {entry.recipeId && (
                    <span className="text-xs font-semibold text-primary">見る</span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
