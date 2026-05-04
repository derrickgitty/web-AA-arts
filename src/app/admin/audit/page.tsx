import { getDb } from "@/lib/db";

type Row = {
  id: number;
  admin_name: string | null;
  action_type: string;
  target_user: string | null;
  details: string | null;
  created_at: number;
};

const LABELS: Record<string, string> = {
  reset_password: "🔒 Reset password",
  revoke_share: "💌 Revoke share",
};

export default function AdminAuditPage() {
  const events = getDb()
    .prepare(
      `SELECT a.id, u.display_name as admin_name, a.action_type, t.username as target_user, a.details, a.created_at
       FROM admin_actions a
       LEFT JOIN users u ON u.id = a.admin_id
       LEFT JOIN users t ON t.id = a.target_user_id
       ORDER BY a.created_at DESC LIMIT 200`
    )
    .all() as Row[];

  return (
    <>
      <h1 className="font-display text-3xl text-lilac-500 mb-1">📜 Audit log</h1>
      <p className="text-gray-500 mb-6">Last 200 admin actions.</p>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-blush-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(e.created_at * 1000).toLocaleString()}</td>
                <td className="px-4 py-3">{e.admin_name ?? "—"}</td>
                <td className="px-4 py-3">{LABELS[e.action_type] ?? e.action_type}</td>
                <td className="px-4 py-3 font-mono">{e.target_user ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{e.details ?? "—"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No actions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
