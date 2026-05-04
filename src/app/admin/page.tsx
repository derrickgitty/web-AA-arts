import Link from "next/link";
import { getDb } from "@/lib/db";

export default function AdminDashboard() {
  const db = getDb();
  const [{ users }, { kids }, { shares }, { logins }, { fails }] = [
    db.prepare("SELECT COUNT(*) as users FROM users").get() as { users: number },
    db.prepare("SELECT COUNT(*) as kids FROM users WHERE role = 'kid'").get() as { kids: number },
    db.prepare(
      "SELECT COUNT(*) as shares FROM shares WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > strftime('%s','now'))"
    ).get() as { shares: number },
    db.prepare("SELECT COUNT(*) as logins FROM login_events WHERE success = 1 AND created_at >= strftime('%s','now') - 86400 * 7").get() as { logins: number },
    db.prepare("SELECT COUNT(*) as fails FROM login_events WHERE success = 0 AND created_at >= strftime('%s','now') - 86400 * 7").get() as { fails: number },
  ];

  return (
    <>
      <h1 className="font-display text-3xl text-lilac-500 mb-1">Welcome back 🛠</h1>
      <p className="text-gray-500 mb-8">Quick look at your art portal.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Users" value={users} />
        <Stat label="Kids" value={kids} />
        <Stat label="Active shares" value={shares} />
        <Stat label="Logins (7d)" value={`${logins} ✓ / ${fails} ✗`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/users" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">👧</div>
          <h2 className="font-display text-lg text-lilac-500">Users</h2>
          <p className="text-sm text-gray-500">Reset passwords, see usage.</p>
        </Link>
        <Link href="/admin/shares" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">💌</div>
          <h2 className="font-display text-lg text-lilac-500">Shares</h2>
          <p className="text-sm text-gray-500">See who got which link, revoke any of them.</p>
        </Link>
        <Link href="/admin/logins" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">🔑</div>
          <h2 className="font-display text-lg text-lilac-500">Login history</h2>
          <p className="text-sm text-gray-500">Every successful and failed sign-in.</p>
        </Link>
        <Link href="/admin/audit" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">📜</div>
          <h2 className="font-display text-lg text-lilac-500">Audit log</h2>
          <p className="text-sm text-gray-500">Every admin action, with timestamp.</p>
        </Link>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="font-display text-2xl text-lilac-500">{value}</p>
    </div>
  );
}
