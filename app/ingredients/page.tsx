"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { useAuthContext } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { type Ingredient } from "@/lib/api";

type EditForm = {
  name: string;
  quantity: string;
  unit: string;
  deadline: string;
};

export default function IngredientsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { list, error, methods } = useIngredients();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("expiry_asc");

  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", quantity: "", unit: "", deadline: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void methods.list({ search, sort });
    }
  }, [isAuthenticated, search, sort, methods]);

  const openEdit = (item: Ingredient) => {
    setEditTarget(item);
    setEditForm({
      name: item.name,
      quantity: item.quantity !== null ? String(item.quantity) : "",
      unit: item.unit ?? "",
      deadline: item.deadline ? item.deadline.slice(0, 10) : "",
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      setEditError("食材名を入力してください");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await methods.update(editTarget.id, {
        name: editForm.name.trim(),
        quantity: editForm.quantity !== "" ? Number(editForm.quantity) : null,
        unit: editForm.unit.trim() || null,
        deadline: editForm.deadline || null,
      });
      setEditTarget(null);
      void methods.list({ search, sort });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await methods.delete(deleteTarget.id);
      setDeleteTarget(null);
      void methods.list({ search, sort });
    } catch {
      // エラーは無視して閉じる
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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

  const ingredients = list.data || [];

  const getDaysUntilExpiry = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((new Date(deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusLabel = (days: number | null) => {
    if (days === null) return { label: "無期限", cls: "bg-secondary-container text-on-secondary-container" };
    if (days <= 0) return { label: "期限切れ", cls: "bg-error-container text-on-error-container" };
    if (days <= 3) return { label: `あと${days}日`, cls: "bg-error-container text-on-error-container" };
    if (days <= 7) return { label: `あと${days}日`, cls: "bg-secondary-container text-on-secondary-container" };
    return { label: `あと${days}日`, cls: "bg-tertiary-container text-on-tertiary-container" };
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">在庫</p>
            <h2 className="text-2xl font-semibold">食材</h2>
          </div>
          <Link
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
            href="/ingredients/new"
          >
            食材を追加
          </Link>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2">
              <span className="text-xs text-on-surface-variant">検索</span>
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="食材を検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="expiry_asc">期限が近い順</option>
              <option value="expiry_desc">期限が遠い順</option>
              <option value="name_asc">名前順</option>
              <option value="created_desc">登録順</option>
            </select>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
              {error.message}
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-outline-variant/40">
            {list.loading ? (
              <div className="flex items-center justify-center p-8">
                <p>読み込み中...</p>
              </div>
            ) : ingredients.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-on-surface-variant">
                <p>食材がありません</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-medium">食材名</th>
                    <th className="px-4 py-3 font-medium">数量</th>
                    <th className="px-4 py-3 font-medium">期限</th>
                    <th className="px-4 py-3 font-medium">状態</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((item: Ingredient) => {
                    const days = getDaysUntilExpiry(item.deadline);
                    const status = getStatusLabel(days);
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low"
                      >
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">
                          {item.quantity !== null ? `${item.quantity}${item.unit ?? ""}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {item.deadline
                            ? new Date(item.deadline).toLocaleDateString("ja-JP")
                            : "無期限"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-outline-variant px-3 py-1 text-xs font-medium text-on-surface-variant hover:bg-surface-container-low"
                              onClick={() => openEdit(item)}
                            >
                              編集
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-error/30 px-3 py-1 text-xs font-medium text-error hover:bg-error-container"
                              onClick={() => setDeleteTarget(item)}
                            >
                              削除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold">食材を編集</h3>
            <div className="mt-4 grid gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                食材名
                <input
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  数量
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                    placeholder="未設定"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium">
                  単位
                  <input
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="g, ml, 個..."
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium">
                賞味期限
                <input
                  type="date"
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </label>
            </div>
            {editError && (
              <div className="mt-3 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
                {editError}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
                onClick={() => setEditTarget(null)}
                disabled={editSaving}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                onClick={handleEditSave}
                disabled={editSaving}
              >
                {editSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold">食材を削除</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">「{deleteTarget.name}」</span>
              を削除しますか？この操作は取り消せません。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-full bg-error px-5 py-2 text-sm font-semibold text-on-error disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
