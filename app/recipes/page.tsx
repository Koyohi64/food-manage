import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const recipes = [
  {
    id: "1",
    name: "ガーリックチキンボウル",
    time: "25分",
    tag: "たんぱく質",
  },
  {
    id: "2",
    name: "味噌野菜スープ",
    time: "18分",
    tag: "ロス削減",
  },
  {
    id: "3",
    name: "柑橘サーモンプレート",
    time: "30分",
    tag: "新鮮",
  },
];

const history = [
  { id: "3", name: "柑橘サーモンプレート", date: "5月28日" },
  { id: "2", name: "味噌野菜スープ", date: "5月27日" },
  { id: "1", name: "ガーリックチキンボウル", date: "5月26日" },
];

export default function RecipesPage() {
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
              />
            </div>
            <select className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
              <option>更新順</option>
              <option>調理時間順</option>
              <option>名前順</option>
            </select>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                className="flex flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4 transition hover:bg-surface-container"
                href={`/recipes/${recipe.id}`}
              >
                <div className="flex h-28 items-center justify-center rounded-xl bg-surface-container-high text-xs text-on-surface-variant">
                  サムネイル
                </div>
                <div>
                  <p className="font-semibold">{recipe.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{recipe.time}</span>
                    <span className="rounded-full bg-secondary-container px-2 py-1 font-semibold text-on-secondary-container">
                      {recipe.tag}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <h3 className="text-lg font-semibold">料理履歴</h3>
          <div className="mt-4 space-y-3">
            {history.map((entry) => (
              <Link
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                href={`/recipes/${entry.id}`}
              >
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {entry.date}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">
                  見る
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
