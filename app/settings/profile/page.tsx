"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { useUser } from "@/lib/hooks/useUser";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const user = useUser();
  const [name, setName] = useState(user.profile.data?.name ?? "");
  const [email, setEmail] = useState(user.profile.data?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user.profile.data === null && !user.profile.loading) {
      void user.methods.getProfile();
    }
  }, [isAuthenticated, user.methods, user.profile.data, user.profile.loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await user.methods.updateProfile({
        name,
        email,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "更新に失敗しました";
      setError(message);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center">
          <p>認証中...</p>
        </div>
      </AppShell>
    );
  }

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

        <form
          className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              ユーザー名
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="アレックス シェフ"
                value={name || (user.profile.data?.name ?? "")}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              メールアドレス
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="alex@example.com"
                type="email"
                value={email || (user.profile.data?.email ?? "")}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-lg bg-primary/20 p-3 text-sm text-primary">
              プロフィールが更新されました
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
              type="submit"
              disabled={user.profile.loading}
            >
              {user.profile.loading ? "保存中..." : "変更を保存"}
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
