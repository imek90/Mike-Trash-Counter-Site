export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      {children}
    </section>
  );
}
