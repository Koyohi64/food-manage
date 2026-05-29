import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          キッチンに参加
        </p>
        <h1 className="mt-2 text-2xl font-semibold">アカウント作成</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          食材とレシピ管理を始めましょう。
        </p>
      </div>

      <form className="flex flex-col gap-4">
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
        <label className="flex flex-col gap-2 text-sm font-medium">
          パスワード
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="••••••••"
            type="password"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          パスワード確認
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="••••••••"
            type="password"
          />
        </label>
        <button
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
          type="button"
        >
          アカウント作成
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        アカウントをお持ちですか？{" "}
        <Link className="font-semibold text-primary" href="/login">
          ログイン
        </Link>
      </p>
    </div>
  );
}
