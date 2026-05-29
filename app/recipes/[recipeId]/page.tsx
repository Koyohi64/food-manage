import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const ingredients = [
  "鶏むね肉",
  "ほうれん草",
  "にんにく",
  "オリーブオイル",
  "ごはん",
];

const steps = [
  "鶏肉に下味をつけ、オリーブオイルで6分ほど焼きます。",
  "にんにくとほうれん草を加え、しんなりするまで炒めます。",
  "温かいごはんにのせ、肉汁を回しかけます。",
];

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">
              レシピ #{recipeId}
            </p>
            <h2 className="text-2xl font-semibold">ガーリックチキンボウル</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
              href={`/recipes/${recipeId}/edit`}
            >
              レシピを編集
            </Link>
            <button
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              作った報告
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">材料</h3>
            <div className="mt-4 space-y-3 text-sm">
              {ingredients.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                >
                  <input type="checkbox" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">手順</h3>
            <ol className="mt-4 space-y-4 text-sm text-on-surface-variant">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-container text-xs font-semibold text-on-secondary-container">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
