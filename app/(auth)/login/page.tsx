"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthContext } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      await login({ email, password });
      router.push("/ingredients");
    } catch (err) {
      const message = err instanceof Error ? err.message : "ログインに失敗しました";
      setLocalError(message);
    }
  };

  const displayError = error?.message || localError;

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

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium">
          メールアドレス
          <input
            className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
            placeholder="chef@home.com"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          {loading ? "ログイン中..." : "ログイン"}
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
