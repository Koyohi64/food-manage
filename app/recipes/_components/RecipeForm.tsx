"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useAuthContext } from "@/lib/context/AuthContext";
import { type Ingredient, type RecipeContent } from "@/lib/api";

type RecipeFormProps = {
  mode: "create" | "edit";
  recipeId?: string;
};

const DISH_LABELS = ["メイン料理", "副菜1", "副菜2", "副菜3", "副菜4"];

export default function RecipeForm({ mode, recipeId }: RecipeFormProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const ingredientsHook = useIngredients();
  const recipesHook = useRecipes();

  const isEdit = mode === "edit";
  const title = isEdit ? "レシピ編集" : "レシピ作成";

  const [recipeNames, setRecipeNames] = useState<string[]>([""]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preferences, setPreferences] = useState("");
  const [servings, setServings] = useState(2);
  const [dishCount, setDishCount] = useState(1);
  const [strictIngredients, setStrictIngredients] = useState(true);
  const [generatedContents, setGeneratedContents] = useState<RecipeContent[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void ingredientsHook.methods.list({ sort: "expiry_asc", limit: 50 });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isEdit && recipeId && isAuthenticated) {
      void recipesHook.methods.get(recipeId).then((recipe) => {
        if (recipe) {
          setRecipeNames([recipe.name]);
          setGeneratedContents([recipe.content]);
        }
      });
    }
  }, [isEdit, recipeId, isAuthenticated]);

  const allIngredients = ingredientsHook.list.data || [];

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const updateRecipeName = (index: number, value: string) => {
    setRecipeNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setError("食材を1つ以上選択してください");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const contents = await recipesHook.methods.aiGenerate({
        ingredientIds: selectedIds,
        preferences: preferences || undefined,
        servings,
        dishCount,
        strictIngredients,
      });
      if (contents && contents.length > 0) {
        setGeneratedContents(contents);
        const date = new Date().toLocaleDateString("ja-JP");
        setRecipeNames(
          contents.map((_, i) =>
            contents.length === 1
              ? `AIレシピ (${date})`
              : `AIレシピ・${DISH_LABELS[i] ?? `${i + 1}品目`} (${date})`
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (recipeNames.some((n) => !n.trim())) {
      setError("すべてのレシピ名を入力してください");
      return;
    }
    if (generatedContents.length === 0) {
      setError("レシピ内容がありません。まずAI生成か手動入力を行ってください");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (isEdit && recipeId) {
        await recipesHook.methods.update(recipeId, {
          name: recipeNames[0],
          content: generatedContents[0],
        });
        router.push(`/recipes/${recipeId}`);
      } else {
        const saved: { id: string }[] = [];
        for (const [i, content] of generatedContents.entries()) {
          const recipe = await recipesHook.methods.create({
            name: recipeNames[i] || `AIレシピ${i + 1}`,
            content,
          });
          if (recipe) saved.push(recipe);
        }
        if (saved.length > 1) {
          router.push("/recipes");
        } else if (saved[0]) {
          router.push(`/recipes/${saved[0].id}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const saveLabel = isEdit
    ? "変更を保存"
    : generatedContents.length > 1
    ? `${generatedContents.length}品すべてを保存`
    : "レシピを保存";

  const saveDisabled =
    saving ||
    generatedContents.length === 0 ||
    recipeNames.some((n) => !n.trim());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-on-surface-variant">
            {isEdit ? "内容を更新" : "新しいレシピを追加"}
          </p>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
        {isEdit && recipeId ? (
          <Link className="text-sm font-semibold text-primary" href={`/recipes/${recipeId}`}>
            レシピに戻る
          </Link>
        ) : (
          <Link className="text-sm font-semibold text-primary" href="/recipes">
            一覧に戻る
          </Link>
        )}
      </div>

      {!isEdit && (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">AIレシピアシスタント</h3>
              <p className="text-sm text-on-surface-variant">
                食材を選んでレシピを生成します。
              </p>
            </div>
            <button
              className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary disabled:opacity-50"
              type="button"
              disabled={generating || selectedIds.length === 0}
              onClick={handleGenerate}
            >
              {generating ? "生成中..." : "生成"}
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <div>
              <p className="mb-2 text-sm font-medium">食材を選択</p>
              {ingredientsHook.list.loading ? (
                <p className="text-sm text-on-surface-variant">読み込み中...</p>
              ) : allIngredients.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  食材が登録されていません。
                  <Link className="ml-1 text-primary" href="/ingredients/new">
                    食材を追加
                  </Link>
                </p>
              ) : (
                <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-low p-3 text-sm">
                  {allIngredients.map((item: Ingredient) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleIngredient(item.id)}
                      />
                      <span>{item.name}</span>
                      {item.deadline && (
                        <span className="text-xs text-on-surface-variant">
                          (期限: {new Date(item.deadline).toLocaleDateString("ja-JP")})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">食材の使い方</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    strictIngredients
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-low text-on-surface"
                  }`}
                  onClick={() => setStrictIngredients(true)}
                >
                  選択した食材のみ
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    !strictIngredients
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-low text-on-surface"
                  }`}
                  onClick={() => setStrictIngredients(false)}
                >
                  他の食材も使ってOK
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                {strictIngredients
                  ? "選択した食材だけを使ったレシピを生成します"
                  : "選択食材を中心に、調味料など他の食材も自由に使ったレシピを生成します"}
              </p>
            </div>

            <div className="grid gap-3">
              <label className="flex flex-col gap-2 text-sm font-medium">
                追加条件（任意）
                <input
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                  placeholder="ガッツリ系、火を使わないで..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  maxLength={200}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  人数
                  <select
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                  >
                    <option value={1}>1人分</option>
                    <option value={2}>2人分</option>
                    <option value={3}>3人分</option>
                    <option value={4}>4人分</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  品数
                  <select
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                    value={dishCount}
                    onChange={(e) => setDishCount(Number(e.target.value))}
                  >
                    <option value={1}>1品</option>
                    <option value={2}>2品</option>
                    <option value={3}>3品</option>
                    <option value={4}>4品</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* レシピカード群 */}
      <div className="flex flex-col gap-4">
        {generatedContents.length === 0 ? (
          /* 未生成：名前入力 + 保存ボタンのプレースホルダー */
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <div className="grid gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                レシピ名
                <input
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                  placeholder="ガーリックチキンボウル"
                  value={recipeNames[0] ?? ""}
                  onChange={(e) => updateRecipeName(0, e.target.value)}
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                type="button"
                disabled={saveDisabled}
                onClick={handleSave}
              >
                {saving ? "保存中..." : saveLabel}
              </button>
            </div>
          </div>
        ) : (
          <>
            {generatedContents.map((content, i) => (
              <div
                key={i}
                className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm"
              >
                {generatedContents.length > 1 && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-on-surface-variant">
                      {DISH_LABELS[i] ?? `${i + 1}品目`}
                    </span>
                  </div>
                )}
                <div className="grid gap-4">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    レシピ名
                    <input
                      className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                      placeholder="レシピ名"
                      value={recipeNames[i] ?? ""}
                      onChange={(e) => updateRecipeName(i, e.target.value)}
                    />
                  </label>

                  <div>
                    <p className="mb-2 text-sm font-medium">材料</p>
                    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 text-sm">
                      {content.ingredients.map((ing, j) => (
                        <div key={j} className="flex justify-between py-1">
                          <span>{ing.name}</span>
                          <span className="text-on-surface-variant">
                            {ing.quantity != null ? `${ing.quantity}` : ""}
                            {ing.unit ? ` ${ing.unit}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">手順</p>
                    <ol className="space-y-2 rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 text-sm">
                      {content.steps.map((step) => (
                        <li key={step.order} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
                            {step.order}
                          </span>
                          <p>{step.description}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                type="button"
                disabled={saveDisabled}
                onClick={handleSave}
              >
                {saving ? "保存中..." : saveLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
