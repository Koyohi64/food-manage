import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-16 text-on-surface">
      <div className="max-w-md rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          指定されたページは存在しません。
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
          href="/"
        >
          ダッシュボードへ
        </Link>
      </div>
    </div>
  );
}
