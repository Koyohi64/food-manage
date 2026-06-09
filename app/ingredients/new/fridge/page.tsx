"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_components/AppShell";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { compressImage } from "@/lib/compressImage";
import type { AnalyzedIngredient } from "@/lib/api";

type EditableItem = {
  checked: boolean;
  name: string;
  quantity: string;
  unit: string;
  deadline: string;
  confidence: number | null;
};

function toEditable(ingredient: AnalyzedIngredient): EditableItem {
  return {
    checked: true,
    name: ingredient.name,
    quantity: ingredient.quantity != null ? String(ingredient.quantity) : "",
    unit: ingredient.unit ?? "",
    deadline: ingredient.estimatedExpiryDate ?? "",
    confidence: ingredient.confidence ?? null,
  };
}

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  const color =
    value >= 0.75
      ? "bg-primary/10 text-primary"
      : value >= 0.45
      ? "bg-secondary-container/60 text-on-secondary-container"
      : "bg-error-container text-on-error-container";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      確信度 {pct}%
    </span>
  );
}

export default function FridgeIngredientPage() {
  const router = useRouter();
  const { methods } = useIngredients();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setItems([]);
    setAnalyzed(false);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setItems([]);
    setAnalyzed(false);
    setError(null);
    try {
      const compressed = await compressImage(file).catch(() => file);
      const result = await methods.analyzeFridge(compressed);
      setItems(result.ingredients.map(toEditable));
      setAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解析に失敗しました");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (
    index: number,
    field: keyof EditableItem,
    value: string | boolean
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const checkedCount = items.filter((i) => i.checked).length;

  const handleSave = async () => {
    if (checkedCount === 0) return;
    setSaving(true);
    setError(null);
    try {
      await methods.create(
        items
          .filter((i) => i.checked)
          .map((item) => ({
            name: item.name,
            quantity: item.quantity ? parseFloat(item.quantity) : null,
            unit: item.unit || null,
            deadline: item.deadline || null,
            source: "fridge_photo" as const,
          }))
      );
      router.push("/ingredients");
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
            <h2 className="text-2xl font-semibold">冷蔵庫撮影</h2>
          </div>
          <Link
            className="text-sm font-semibold text-primary"
            href="/ingredients/new"
          >
            戻る
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* アップロードパネル */}
          <div className="flex flex-col rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="冷蔵庫の画像をアップロード"
              className={`flex min-h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
                dragging
                  ? "border-primary bg-surface-container-high"
                  : "border-outline-variant bg-surface-container-low"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="冷蔵庫プレビュー"
                  className="max-h-64 w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-4 text-on-surface-variant">
                  <svg
                    className="h-10 w-10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                    />
                  </svg>
                  <p className="text-sm">クリックまたはドロップして画像を選択</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-on-surface-variant">
              冷蔵庫の棚が見えるように撮影してください。ざっくりでOKです。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                className="flex-1 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface-variant"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                画像を選択
              </button>
              <button
                className="flex-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                type="button"
                disabled={!file || analyzing}
                onClick={handleAnalyze}
              >
                {analyzing ? "認識中..." : "解析する"}
              </button>
            </div>
          </div>

          {/* 結果パネル */}
          <div className="flex flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">認識された食材</h3>

            {!analyzed && !analyzing && (
              <p className="mt-4 text-sm text-on-surface-variant">
                冷蔵庫の写真をアップロードして「解析する」を押してください。
              </p>
            )}

            {analyzing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                AIが食材を認識中です...
              </div>
            )}

            {analyzed && items.length === 0 && (
              <p className="mt-4 text-sm text-on-surface-variant">
                食材を認識できませんでした。別の画像をお試しください。
              </p>
            )}

            {items.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-opacity ${
                      item.checked
                        ? "border-primary/30 bg-surface-container-low"
                        : "border-outline-variant/20 bg-surface-container-low opacity-40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={item.checked}
                      onChange={(e) =>
                        updateItem(index, "checked", e.target.checked)
                      }
                    />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm font-medium"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(index, "name", e.target.value)
                          }
                        />
                        <ConfidenceBadge value={item.confidence} />
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          className="w-16 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs"
                          placeholder="数量"
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                        />
                        <input
                          className="w-16 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs"
                          placeholder="単位"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(index, "unit", e.target.value)
                          }
                        />
                        <input
                          className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-xs"
                          type="date"
                          value={item.deadline}
                          onChange={(e) =>
                            updateItem(index, "deadline", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-error-container p-3 text-sm text-on-error-container">
                {error}
              </div>
            )}

            {items.length > 0 && (
              <button
                className="mt-5 w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
                type="button"
                disabled={checkedCount === 0 || saving}
                onClick={handleSave}
              >
                {saving ? "追加中..." : `${checkedCount}件の食材を追加`}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
