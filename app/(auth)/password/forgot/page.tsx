import Link from "next/link";

export default function PasswordForgotPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          再設定
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          パスワードを忘れた場合
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          再設定リンクをメールで送信します。
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
        <button
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
          type="button"
        >
          再設定リンクを送信
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant">
        <Link className="font-semibold text-primary" href="/login">
          ログインに戻る
        </Link>
      </p>
    </div>
  );
}
