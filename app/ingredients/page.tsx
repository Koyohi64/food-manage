import Link from "next/link";

import AppShell from "@/app/_components/AppShell";

const ingredients = [
  {
    name: "トマト",
    category: "野菜",
    quantity: "4個",
    expiry: "6月02日",
    status: "新鮮",
  },
  {
    name: "ギリシャヨーグルト",
    category: "乳製品",
    quantity: "1カップ",
    expiry: "6月01日",
    status: "早めに使用",
  },
  {
    name: "バジル",
    category: "ハーブ",
    quantity: "1束",
    expiry: "5月31日",
    status: "早めに使用",
  },
  {
    name: "米",
    category: "穀類",
    quantity: "2kg",
    expiry: "8月20日",
    status: "在庫あり",
  },
];

export default function IngredientsPage() {
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
              />
            </div>
            <select className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
              <option>期限順</option>
              <option>名前順</option>
              <option>カテゴリ順</option>
            </select>
            <select className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
              <option>すべてのカテゴリ</option>
              <option>野菜</option>
              <option>乳製品</option>
              <option>たんぱく質</option>
            </select>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-outline-variant/40">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">食材名</th>
                  <th className="px-4 py-3 font-medium">カテゴリ</th>
                  <th className="px-4 py-3 font-medium">数量</th>
                  <th className="px-4 py-3 font-medium">期限</th>
                  <th className="px-4 py-3 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((item) => (
                  <tr
                    key={item.name}
                    className="border-t border-outline-variant/30 bg-surface-container-lowest"
                  >
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {item.category}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.expiry}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
