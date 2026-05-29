import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const expiringItems = [
  { name: "ほうれん草", daysLeft: 2, quantity: "1袋" },
  { name: "鶏むね肉", daysLeft: 3, quantity: "400g" },
  { name: "牛乳", daysLeft: 4, quantity: "1本" },
];

const recentRecipes = [
  { id: "1", name: "ガーリックチキンボウル", date: "今日" },
  { id: "2", name: "味噌野菜スープ", date: "昨日" },
  { id: "3", name: "柑橘サーモンプレート", date: "2日前" },
];

export default function DashboardPage() {
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
            <p className="mt-4 text-3xl font-semibold">5月29日</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              今日はある食材を優先して使いましょう。
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              期限間近
            </p>
            <p className="mt-4 text-3xl font-semibold">3件</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              これらでレシピを考えましょう。
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
              保存済みレシピ
            </p>
            <p className="mt-4 text-3xl font-semibold">12</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              作る習慣を続けましょう。
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
              {expiringItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.quantity}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
                    {item.daysLeft}日
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">最近のレシピ</h3>
            <div className="mt-4 space-y-3">
              {recentRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 transition hover:bg-surface-container"
                  href={`/recipes/${recipe.id}`}
                >
                  <div>
                    <p className="font-medium">{recipe.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {recipe.date}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    開く
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3">
              <p className="text-sm font-medium">レシピのヒントが欲しい？</p>
              <p className="text-xs text-on-surface-variant">
                AIレシピ生成で新しいプランを作成できます。
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
