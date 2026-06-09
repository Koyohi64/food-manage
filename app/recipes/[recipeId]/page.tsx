"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useHistory } from "@/lib/hooks/useHistory";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@/lib/api";
import { convertToStoredUnit } from "@/lib/units";

type ConsumeItem = {
  recipeIngredientName: string;
  ingredient: Ingredient;
  consumeQuantity: number;
  enabled: boolean;
};

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = use(params);
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const recipes = useRecipes();
  const history = useHistory();
  const ingredientsHook = useIngredients();

  const [showModal, setShowModal] = useState(false);
  const [consumeItems, setConsumeItems] = useState<ConsumeItem[]>([]);
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && recipeId) {
      void recipes.methods.get(recipeId);
      void ingredientsHook.methods.list({ limit: 100 });
    }
  }, [isAuthenticated, recipeId]);

  const recipe = recipes.item.data;
  const storedIngredients = ingredientsHook.list.data ?? [];

  const openModal = () => {
    if (!recipe) return;
    const items: ConsumeItem[] = [];
    for (const ri of recipe.content.ingredients) {
      const match = storedIngredients.find(
        (s) => s.name.toLowerCase() === ri.name.toLowerCase()
      );
      if (!match) continue;

      const recipeQty = typeof ri.quantity === "number" ? ri.quantity : null;

      // 大さじ/小さじ/カップ等を在庫の単位に換算
      let convertedQty = recipeQty;
      if (recipeQty !== null && ri.unit && match.unit) {
        const converted = convertToStoredUnit(recipeQty, ri.unit, match.unit);
        convertedQty = converted.quantity;
      }

      const defaultQty =
        convertedQty !== null && match.quantity !== null
          ? Math.min(convertedQty, match.quantity)
          : convertedQty ?? 1;

      items.push({
        recipeIngredientName: ri.name,
        ingredient: match,
        consumeQuantity: defaultQty,
        enabled: true,
      });
    }
    setConsumeItems(items);
    setReportError(null);
    setShowModal(true);
  };

  const handleReport = async () => {
    if (!recipe) return;
    setReportError(null);
    setReporting(true);
    try {
      const consumedIngredients = consumeItems
        .filter((item) => item.enabled && item.consumeQuantity > 0)
        .map((item) => ({
          ingredientId: item.ingredient.id,
          quantity: item.consumeQuantity,
        }));

      await history.methods.create({
        recipeId: recipe.id,
        consumedIngredients,
      });
      setShowModal(false);
      setReported(true);
      setTimeout(() => setReported(false), 3000);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "報告に失敗しました");
    } finally {
      setReporting(false);
    }
  };

  const updateItem = (index: number, patch: Partial<ConsumeItem>) => {
    setConsumeItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  if (authLoading || !isAuthenticated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-8">
          <p>認証中...</p>
        </div>
      </AppShell>
    );
  }

  if (recipes.item.loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center p-8">
          <p>読み込み中...</p>
        </div>
      </AppShell>
    );
  }

  if (!recipe) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-4 p-8">
          <p className="text-on-surface-variant">レシピが見つかりません</p>
          <Link className="text-sm font-semibold text-primary" href="/recipes">
            レシピ一覧へ
          </Link>
        </div>
      </AppShell>
    );
  }

  const { content } = recipe;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">
              {content.difficulty === "easy"
                ? "簡単"
                : content.difficulty === "medium"
                ? "普通"
                : content.difficulty === "hard"
                ? "難しい"
                : "レシピ"}
              {content.cookingTimeMinutes ? ` · ${content.cookingTimeMinutes}分` : ""}
            </p>
            <h2 className="text-2xl font-semibold">{recipe.name}</h2>
            {content.description && (
              <p className="mt-1 text-sm text-on-surface-variant">{content.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
              href={`/recipes/${recipeId}/edit`}
            >
              レシピを編集
            </Link>
            <button
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
              type="button"
              disabled={reported}
              onClick={openModal}
            >
              {reported ? "報告済み ✓" : "作った！"}
            </button>
          </div>
        </div>

        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">材料</h3>
              {content.servings && (
                <span className="text-sm text-on-surface-variant">{content.servings}人分</span>
              )}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {content.ingredients.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-on-surface-variant">
                    {item.quantity != null ? `${item.quantity}` : ""}
                    {item.unit ? ` ${item.unit}` : ""}
                    {item.note ? ` (${item.note})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">手順</h3>
            <ol className="mt-4 space-y-4 text-sm text-on-surface-variant">
              {content.steps.map((step) => (
                <li key={step.order} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
                    {step.order}
                  </span>
                  <div>
                    <p>{step.description}</p>
                    {step.tip && (
                      <p className="mt-1 text-xs italic text-primary">{step.tip}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* 消費確認モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold">食材の消費確認</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              使った食材と量を確認してください。在庫から差し引かれます。
            </p>

            <div className="mt-4 space-y-3">
              {consumeItems.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  在庫に一致する食材が見つかりませんでした。このまま記録します。
                </p>
              ) : (
                consumeItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => updateItem(i, { enabled: e.target.checked })}
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="flex-1 text-sm font-medium">{item.ingredient.name}</span>
                    <div className="flex items-center gap-1 text-sm">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={item.consumeQuantity}
                        disabled={!item.enabled}
                        onChange={(e) =>
                          updateItem(i, { consumeQuantity: Number(e.target.value) })
                        }
                        className="w-20 rounded-lg border border-outline-variant bg-surface px-2 py-1 text-right text-sm disabled:opacity-40"
                      />
                      <span className="text-on-surface-variant">
                        {item.ingredient.unit ?? ""}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant">
                      (在庫:{item.ingredient.quantity ?? "?"}{item.ingredient.unit ?? ""})
                    </span>
                  </div>
                ))
              )}
            </div>

            {reportError && (
              <div className="mt-3 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
                {reportError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
                onClick={() => setShowModal(false)}
                disabled={reporting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                onClick={handleReport}
                disabled={reporting}
              >
                {reporting ? "記録中..." : "記録する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
