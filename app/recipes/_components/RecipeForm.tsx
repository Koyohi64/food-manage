import Link from "next/link";

type RecipeFormProps = {
  mode: "create" | "edit";
  recipeId?: string;
};

export default function RecipeForm({ mode, recipeId }: RecipeFormProps) {
  const isEdit = mode === "edit";
  const title = isEdit ? "レシピ編集" : "レシピ作成";
  const actionLabel = isEdit ? "変更を保存" : "レシピを保存";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-on-surface-variant">
            {isEdit ? "内容を更新" : "新しいレシピを追加"}
          </p>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
        {isEdit && recipeId ? (
          <Link
            className="text-sm font-semibold text-primary"
            href={`/recipes/${recipeId}`}
          >
            レシピに戻る
          </Link>
        ) : (
          <Link className="text-sm font-semibold text-primary" href="/recipes">
            一覧に戻る
          </Link>
        )}
      </div>

      {!isEdit && (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                AIレシピアシスタント
              </h3>
              <p className="text-sm text-on-surface-variant">
                使いたい材料を入力して下書きを生成します。
              </p>
            </div>
            <button
              className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary"
              type="button"
            >
              生成
            </button>
          </div>
          <div className="mt-4">
            <input
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              placeholder="鶏肉、ほうれん草、ごはん"
            />
            <p className="mt-2 text-xs text-on-surface-variant">
              生成中はフォームがロックされます。
            </p>
          </div>
        </div>
      )}

      <form className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
            レシピ名
            <input
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              placeholder="ガーリックチキンボウル"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            主な食材
            <div className="grid gap-2 rounded-xl border border-outline-variant bg-surface-container-low p-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                鶏むね肉
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                ほうれん草
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                にんにく
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                オリーブオイル
              </label>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            人数
            <select className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm">
              <option>2人分</option>
              <option>4人分</option>
              <option>6人分</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium md:col-span-2">
            手順
            <textarea
              className="min-h-[160px] rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
              placeholder="1. 食材を準備する..."
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
            type="button"
          >
            {actionLabel}
          </button>
          <button
            className="rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface-variant"
            type="button"
          >
            下書きを保存
          </button>
        </div>
      </form>
    </div>
  );
}
