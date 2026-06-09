"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useStats } from "@/lib/hooks/useStats";

const navItems = [
  { href: "/", label: "ダッシュボード" },
  { href: "/ingredients", label: "食材" },
  { href: "/recipes", label: "レシピ" },
];

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { logout, isAuthenticated, loading } = useAuthContext();
  const stats = useStats();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container font-semibold">
              ZK
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                Zubora Kitchen
              </p>
              <h1 className="text-lg font-semibold">キッチンワークスペース</h1>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className="rounded-full border border-outline-variant px-4 py-2 text-on-surface-variant transition hover:text-on-surface"
              href="/settings"
            >
              設定
            </Link>
            {isAuthenticated && (
              <button
                className="rounded-full bg-primary px-4 py-2 font-medium text-on-primary transition hover:bg-primary/90"
                type="button"
                onClick={handleLogout}
              >
                ログアウト
              </button>
            )}
          </nav>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-56 shrink-0 flex-col gap-4 md:flex">
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              ナビゲーション
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              クイックステータス
            </p>
            <div className="mt-3 space-y-3 text-sm text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>食材</span>
                <span className="font-semibold text-on-surface">
                  {stats.loading ? "…" : `${stats.data?.ingredientCount ?? 0}件`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>レシピ</span>
                <span className="font-semibold text-on-surface">
                  {stats.loading ? "…" : `${stats.data?.recipeCount ?? 0}件`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>期限間近</span>
                <span className={`font-semibold ${stats.data && stats.data.expiringCount > 0 ? "text-error" : "text-on-surface"}`}>
                  {stats.loading ? "…" : `${stats.data?.expiringCount ?? 0}件`}
                </span>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
