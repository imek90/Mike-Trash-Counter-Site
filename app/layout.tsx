import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="min-h-screen bg-slate-50 text-slate-900 antialiased"
      >
        <header className="border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                MT
              </span>
              <span>Mike Trash Counter</span>
            </Link>

            <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
