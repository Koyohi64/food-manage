import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-on-surface-variant">アカウント</p>
          <h2 className="text-2xl font-semibold">設定</h2>
        </div>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">プロフィール</h3>
              <p className="text-sm text-on-surface-variant">
                名前、メール、パスワード設定を更新します。
              </p>
            </div>
            <Link
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
              href="/settings/profile"
            >
              プロフィール編集
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="text-lg font-semibold">通知</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm">
              期限アラート
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm">
              レシピリマインド
              <input type="checkbox" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm md:col-span-2">
              通知タイミング
              <select className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
                <option>3日前</option>
                <option>5日前</option>
                <option>7日前</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="text-lg font-semibold">テーマ</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button
              className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-medium"
              type="button"
            >
              ライト
            </button>
            <button
              className="rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-medium"
              type="button"
            >
              ダーク
            </button>
            <button
              className="rounded-xl border border-outline-variant/60 bg-surface-container px-4 py-3 text-sm font-medium"
              type="button"
            >
              システム
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="text-lg font-semibold">アカウント操作</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
              type="button"
            >
              ログアウト
            </button>
            <button
              className="rounded-full bg-error px-4 py-2 text-sm font-semibold text-on-error"
              type="button"
            >
              アカウント削除
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
