import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            padding: 16,
            borderBottom: "1px solid #ddd",
            marginBottom: 24,
          }}
        >
          <Link href="/" style={{ marginRight: 12 }}>
            Home
          </Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>

        {children}
      </body>
    </html>
  );
}
