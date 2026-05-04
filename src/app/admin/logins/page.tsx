import { getDb } from "@/lib/db";

type Row = {
  id: number;
  username_attempted: string;
  display_name: string | null;
  success: number;
  ip: string | null;
  user_agent: string | null;
  created_at: number;
};

export default function AdminLoginsPage() {
  const events = getDb()
    .prepare(
      `SELECT e.id, e.username_attempted, u.display_name, e.success, e.ip, e.user_agent, e.created_at
       FROM login_events e LEFT JOIN users u ON u.id = e.user_id
       ORDER BY e.created_at DESC LIMIT 200`
    )
    .all() as Row[];

  return (
    <>
      <h1 className="font-display text-3xl text-lilac-500 mb-1">🔑 Login history</h1>
      <p className="text-gray-500 mb-6">Last 200 attempts.</p>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Browser</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-blush-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(e.created_at * 1000).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="font-mono">{e.username_attempted}</span>
                  {e.display_name && <span className="text-gray-400 ml-2">({e.display_name})</span>}
                </td>
                <td className="px-4 py-3">
                  {e.success ? (
                    <span className="text-mint-500">✓ Success</span>
                  ) : (
                    <span className="text-blush-500">✗ Failed</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.ip ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{e.user_agent ?? "—"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No logins yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
