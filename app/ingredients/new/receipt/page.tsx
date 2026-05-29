import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const extractedItems = [
  { name: "卵", quantity: "12個", expiry: "6月05日" },
  { name: "ほうれん草", quantity: "1袋", expiry: "6月01日" },
  { name: "豆乳", quantity: "1本", expiry: "6月03日" },
];

export default function ReceiptIngredientPage() {
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
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center shadow-sm">
            <div className="mx-auto flex h-48 w-full items-center justify-center rounded-2xl bg-surface-container-low text-on-surface-variant">
              レシートプレビュー
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              くっきり写る写真を撮るか、画像をアップロードしてください。
            </p>
            <button
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              レシートをアップロード
            </button>
          </div>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-semibold">抽出された食材</h3>
            <div className="mt-4 space-y-3">
              {extractedItems.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3"
                >
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{item.quantity}</span>
                    <span>期限 {item.expiry}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-5 w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
              type="button"
            >
              抽出した食材を追加
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
