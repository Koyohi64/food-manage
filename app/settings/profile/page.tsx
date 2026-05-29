import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">プロフィール</p>
            <h2 className="text-2xl font-semibold">プロフィール編集</h2>
          </div>
          <Link className="text-sm font-semibold text-primary" href="/settings">
            戻る
          </Link>
        </div>

        <form className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              ユーザー名
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="アレックス シェフ"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              メールアドレス
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="alex@example.com"
                type="email"
              />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              変更を保存
            </button>
            <Link
              className="rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface-variant"
              href="/password/forgot"
            >
              パスワード再設定
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
