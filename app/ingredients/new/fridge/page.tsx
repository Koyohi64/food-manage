import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const suggestedItems = [
  { name: "にんじん", note: "新鮮そう", expiry: "6月04日" },
  { name: "ヨーグルト", note: "新規", expiry: "6月06日" },
  { name: "小ねぎ", note: "残りわずか", expiry: "6月01日" },
];

export default function FridgeIngredientPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">食材を追加</p>
            <h2 className="text-2xl font-semibold">冷蔵庫撮影</h2>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href="/ingredients/new"
          >
            戻る
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center shadow-sm">
            <div className="mx-auto flex h-48 w-full items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-variant">
              冷蔵庫プレビュー
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              冷蔵庫の棚が見えるように撮影してください。
            </p>
            <button
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              写真を撮る
            </button>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">追加候補</h3>
            <div className="mt-4 space-y-3">
              {suggestedItems.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{item.note}</span>
                    <span>期限 {item.expiry}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-5 w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              選択した食材を追加
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
