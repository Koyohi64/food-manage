import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          おかえりなさい
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          Zubora Kitchenにログイン
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          食材とレシピを整理しましょう。
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          メールアドレス
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="chef@home.com"
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
        <div className="flex items-center justify-between text-xs text-on-surface-variant">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            ログインを保持
          </label>
          <Link className="font-semibold text-primary" href="/password/forgot">
            パスワードを忘れた方
          </Link>
        </div>
        <button
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
          type="button"
        >
          ログイン
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        はじめての方{" "}
        <Link className="font-semibold text-primary" href="/signup">
          アカウント作成
        </Link>
      </p>
    </div>
  );
}
