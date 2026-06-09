"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useUser } from "@/lib/hooks/useUser";
import { useTheme } from "@/lib/context/ThemeContext";

export default function SettingsPage() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuthContext();
  const user = useUser();
  const { theme, setTheme } = useTheme();

  const [localTheme, setLocalTheme] = useState<"light" | "dark" | "system">(theme);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [warningDay, setWarningDay] = useState(3);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void user.methods.getSettings().then((s) => {
        if (s) {
          setLocalTheme(s.theme);
          setTheme(s.theme);
          setNotificationEnabled(s.notificationEnabled);
          setWarningDay(s.warningDay);
        }
      });
    }
  }, [isAuthenticated]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await user.methods.updateSettings({ theme: localTheme, notificationEnabled, warningDay });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      console.error("Settings save failed:", err);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    const password = prompt("アカウントを削除するにはパスワードを入力してください。");
    if (!password) return;
    try {
      await user.methods.deleteProfile(password);
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Account deletion failed:", err);
      alert("アカウント削除に失敗しました。パスワードが正しいか確認してください。");
    }
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center">
          <p>ログインしてください</p>
        </div>
      </AppShell>
    );
  }

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
              期限アラート通知
              <input
                type="checkbox"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm md:col-span-2">
              期限警告の日数
              <select
                className="rounded-xl border border-outline-variant bg-surface-container px-3 py-1 text-sm"
                value={warningDay}
                onChange={(e) => setWarningDay(Number(e.target.value))}
              >
                <option value={1}>1日前</option>
                <option value={3}>3日前</option>
                <option value={5}>5日前</option>
                <option value={7}>7日前</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="text-lg font-semibold">テーマ</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  localTheme === t
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant bg-surface-container-low"
                }`}
                type="button"
                onClick={() => {
                  setLocalTheme(t);
                  setTheme(t);
                }}
              >
                {t === "light" ? "ライト" : t === "dark" ? "ダーク" : "システム"}
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
            type="button"
            disabled={settingsSaving}
            onClick={handleSaveSettings}
          >
            {settingsSaving ? "保存中..." : settingsSaved ? "保存しました ✓" : "設定を保存"}
          </button>
        </div>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="text-lg font-semibold">アカウント操作</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
              type="button"
              onClick={handleLogout}
            >
              ログアウト
            </button>
            <button
              className="rounded-full bg-error px-4 py-2 text-sm font-semibold text-on-error"
              type="button"
              onClick={handleDeleteAccount}
            >
              アカウント削除
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
