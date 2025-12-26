import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <main style={{ padding: 24 }}>
        <h1>Trash Tracker</h1>
        <p>Track how often you take out the trash.</p>

        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            marginTop: 12,
            padding: "8px 16px",
            background: "#000",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Go to Dashboard
        </Link>
      </main>
    </div>
  );
}
