import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const options = [
  {
    title: "手動入力",
    description: "食材名、数量、期限を手動で追加します。",
    href: "/ingredients/new/manual",
  },
  {
    title: "レシート撮影",
    description: "レシートを撮影して食材を自動抽出します。",
    href: "/ingredients/new/receipt",
  },
  {
    title: "冷蔵庫撮影",
    description: "冷蔵庫を撮影して新しい食材を提案します。",
    href: "/ingredients/new/fridge",
  },
];

export default function IngredientNewPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-on-surface-variant">食材を追加</p>
          <h2 className="text-2xl font-semibold">方法を選択</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {options.map((option) => (
            <Link
              key={option.title}
              className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm transition hover:bg-surface-container-low"
              href={option.href}
            >
              <h3 className="text-lg font-semibold">{option.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                {option.description}
              </p>
              <span className="mt-4 inline-flex text-sm font-semibold text-primary">
                進む
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
