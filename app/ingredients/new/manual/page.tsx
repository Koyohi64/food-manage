import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

export default function ManualIngredientPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">食材を追加</p>
            <h2 className="text-2xl font-semibold">手動入力</h2>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href="/ingredients/new"
          >
            戻る
          </Link>
        </div>
        <form className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              食材名
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="鶏むね肉"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              数量
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="400g"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              期限日
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                type="date"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              保存場所
              <select className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
                <option>冷蔵</option>
                <option>冷凍</option>
                <option>常温</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              保存
            </button>
            <button
              className="rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface-variant"
              type="button"
            >
              続けて追加
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
