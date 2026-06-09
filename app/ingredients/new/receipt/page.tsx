"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_components/AppShell";
import { useIngredients } from "@/lib/hooks/useIngredients";
import { ApiError } from "@/lib/api";
import type { AnalyzedIngredient } from "@/lib/api";
import { compressImage } from "@/lib/compressImage";

type AnalyzeStep = "extracting-text" | "parsing-ingredients" | null;

type EditableItem = {
  checked: boolean;
  name: string;
  quantity: string;
  unit: string;
  deadline: string;
};

function toEditable(ingredient: AnalyzedIngredient): EditableItem {
  return {
    checked: true,
    name: ingredient.name,
    quantity: ingredient.quantity != null ? String(ingredient.quantity) : "",
    unit: ingredient.unit ?? "",
    deadline: ingredient.estimatedExpiryDate ?? "",
  };
}


export default function ReceiptIngredientPage() {
  const router = useRouter();
  const { methods } = useIngredients();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState<AnalyzeStep>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzing = analyzeStep !== null;

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = (f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setItems([]);
    setRawText(null);
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
    setAnalyzeStep("extracting-text");
    setRawText(null);
    setItems([]);
    setAnalyzed(false);
    setError(null);

    const compressed = await compressImage(file).catch(() => file);
    const formData = new FormData();
    formData.append("image", compressed);

    try {
      const response = await fetch("/api/ingredients/analyze-receipt", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "解析に失敗しました");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "text") {
                setRawText(event.rawText);
                setAnalyzeStep("parsing-ingredients");
              } else if (event.type === "ingredients") {
                setItems(event.ingredients.map(toEditable));
                setAnalyzed(true);
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (e) {
              if (!(e instanceof SyntaxError)) throw e;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "解析に失敗しました"
      );
    } finally {
      setAnalyzeStep(null);
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
            source: "receipt" as const,
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
            <h2 className="text-2xl font-semibold">レシート撮影</h2>
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
              aria-label="レシート画像をアップロード"
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
                  alt="レシートプレビュー"
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="text-sm">クリックまたはドロップして画像を選択</p>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-on-surface-variant">
              くっきり写る写真を撮るか、画像をアップロードしてください。
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
                {analyzing ? "解析中..." : "解析する"}
              </button>
            </div>
          </div>

          {/* 結果パネル */}
          <div className="flex flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">抽出された食材</h3>

            {/* 進捗ステップ */}
            {(analyzing || analyzed || rawText) && (
              <div className="mt-4 flex flex-col gap-2">
                {/* ステップ1: テキスト抽出 */}
                <div className="flex items-center gap-2 text-sm">
                  {analyzeStep === "extracting-text" ? (
                    <svg className="h-4 w-4 shrink-0 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : rawText ? (
                    <svg className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-outline-variant" />
                  )}
                  <span className={rawText ? "text-on-surface" : "text-on-surface-variant"}>
                    レシートのテキストを読み取り
                  </span>
                </div>

                {/* ステップ2: 食材識別 */}
                <div className="flex items-center gap-2 text-sm">
                  {analyzeStep === "parsing-ingredients" ? (
                    <svg className="h-4 w-4 shrink-0 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : analyzed ? (
                    <svg className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-outline-variant" />
                  )}
                  <span className={analyzed ? "text-on-surface" : "text-on-surface-variant"}>
                    食材を識別
                  </span>
                </div>
              </div>
            )}

            {/* 初期状態 */}
            {!analyzing && !analyzed && !rawText && (
              <p className="mt-4 text-sm text-on-surface-variant">
                レシートをアップロードして「解析する」を押してください。
              </p>
            )}

            {/* 抽出されたテキスト（折りたたみ） */}
            {rawText && (
              <div className="mt-4">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium text-on-surface-variant"
                  onClick={() => setShowRawText((v) => !v)}
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${showRawText ? "rotate-90" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  読み取ったテキスト
                </button>
                {showRawText && (
                  <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl bg-surface-container p-3 text-xs text-on-surface-variant">
                    {rawText}
                  </pre>
                )}
              </div>
            )}

            {/* 食材が0件のとき */}
            {analyzed && items.length === 0 && (
              <p className="mt-4 text-sm text-on-surface-variant">
                食材を抽出できませんでした。別の画像をお試しください。
              </p>
            )}

            {/* 食材リスト */}
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
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-sm font-medium"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(index, "name", e.target.value)
                        }
                      />
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
