"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/app/_components/AppShell";
import { useIngredients } from "@/lib/hooks/useIngredients";

export default function ManualIngredientPage() {
  const router = useRouter();
  const { methods } = useIngredients();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addRelativeDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeadline(d.toISOString().slice(0, 10));
  };

  const isValid = name.trim() !== "" && quantity !== "" && unit.trim() !== "" && deadline !== "";

  const handleSubmit = async (e: React.FormEvent, continueAdding = false) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("食材名を入力してください");
      return;
    }
    if (quantity === "") {
      setError("数量を入力してください");
      return;
    }
    if (!unit.trim()) {
      setError("単位を入力してください");
      return;
    }
    if (!deadline) {
      setError("賞味期限を入力してください");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await methods.create([{
        name: name.trim(),
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit.trim() || null,
        deadline: deadline || null,
        source: "manual",
      }]);
      if (continueAdding) {
        setName("");
        setQuantity("");
        setUnit("");
        setDeadline("");
      } else {
        router.push("/ingredients");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface-variant">食材を追加</p>
            <h2 className="text-2xl font-semibold">手動入力</h2>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href="/ingredients/new"
          >
            戻る
          </Link>
        </div>
        <form
          className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm"
          onSubmit={(e) => handleSubmit(e)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
              食材名
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="鶏むね肉"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              数量
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="400"
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              単位
              <input
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                placeholder="g、個、袋..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
              <span>賞味期限</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium"
                  onClick={() => addRelativeDays(3)}
                >
                  +3日
                </button>
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium"
                  onClick={() => addRelativeDays(7)}
                >
                  +1週間
                </button>
                <button
                  type="button"
                  className="rounded-full border border-outline-variant px-3 py-1 text-xs font-medium"
                  onClick={() => addRelativeDays(30)}
                >
                  +1ヶ月
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
              type="submit"
              disabled={saving || !isValid}
            >
              {saving ? "保存中..." : "保存"}
            </button>
            <button
              className="rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface-variant disabled:opacity-50"
              type="button"
              disabled={saving || !isValid}
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            >
              続けて追加
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
