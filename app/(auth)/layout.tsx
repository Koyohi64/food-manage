export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-surface-bright text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center justify-center px-6 py-12">
        <div className="w-full rounded-[28px] border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
