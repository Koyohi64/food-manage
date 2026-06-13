"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loading, error } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (name.length < 1 || name.length > 50) {
      setLocalError("ユーザー名は1〜50文字で入力してください");
      return;
    }
    if (password.length < 8) {
      setLocalError("パスワードは8文字以上で入力してください");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("パスワードが一致しません");
      return;
    }

    try {
      await signup({ name, email, password });
      router.push("/ingredients");
    } catch (err) {
      const message = err instanceof Error ? err.message : "アカウント作成に失敗しました";
      setLocalError(message);
    }
  };

  const displayError = error?.message || localError;

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

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          ユーザー名
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="アレックス シェフ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          メールアドレス
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="alex@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          パスワード
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="••••••••"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="text-xs text-on-surface-variant">8文字以上で入力してください</span>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          パスワード確認
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="••••••••"
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>

        {displayError && (
          <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
            {displayError}
          </div>
        )}

        <button
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "作成中..." : "アカウント作成"}
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
