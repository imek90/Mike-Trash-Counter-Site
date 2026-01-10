export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Trash tracking
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        </div>
      </div>
      {children}
    </section>
  );
}
