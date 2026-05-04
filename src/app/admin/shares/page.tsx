import { getDb } from "@/lib/db";
import RevokeShareButton from "@/components/admin/RevokeShareButton";

type Row = {
  id: number;
  recipient_label: string;
  token: string;
  expires_at: number | null;
  revoked_at: number | null;
  created_at: number;
  gallery_name: string;
  owner_name: string;
  views: number;
  last_viewed_at: number | null;
};

function formatStatus(r: Row) {
  if (r.revoked_at) return { label: "Revoked", color: "text-gray-400" };
  if (r.expires_at && r.expires_at < Math.floor(Date.now() / 1000))
    return { label: "Expired", color: "text-gray-400" };
  if (r.expires_at === null) return { label: "Permanent", color: "text-mint-500" };
  return { label: `expires ${new Date(r.expires_at * 1000).toLocaleDateString()}`, color: "text-lilac-500" };
}

export default function AdminSharesPage() {
  const shares = getDb()
    .prepare(
      `SELECT s.id, s.recipient_label, s.token, s.expires_at, s.revoked_at, s.created_at,
        g.name as gallery_name, u.display_name as owner_name,
        (SELECT COUNT(*) FROM share_views v WHERE v.share_id = s.id) as views,
        (SELECT MAX(viewed_at) FROM share_views v WHERE v.share_id = s.id) as last_viewed_at
       FROM shares s
       JOIN galleries g ON g.id = s.gallery_id
       JOIN users u ON u.id = g.user_id
       ORDER BY s.created_at DESC`
    )
    .all() as Row[];

  return (
    <>
      <h1 className="font-display text-3xl text-lilac-500 mb-1">💌 Shares</h1>
      <p className="text-gray-500 mb-6">Every secret link, who it&apos;s for, and what&apos;s happened with it.</p>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-blush-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">By / Gallery</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shares.map((s) => {
              const status = formatStatus(s);
              const active = !s.revoked_at && (s.expires_at === null || s.expires_at > Math.floor(Date.now() / 1000));
              return (
                <tr key={s.id} className="border-t border-blush-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(s.created_at * 1000).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{s.gallery_name}</div>
                    <div className="text-xs text-gray-400">by {s.owner_name}</div>
                  </td>
                  <td className="px-4 py-3 font-medium">{s.recipient_label}</td>
                  <td className={`px-4 py-3 ${status.color}`}>{status.label}</td>
                  <td className="px-4 py-3">
                    {s.views}
                    {s.last_viewed_at && (
                      <div className="text-xs text-gray-400">last {new Date(s.last_viewed_at * 1000).toLocaleString()}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {active ? <RevokeShareButton shareId={s.id} /> : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
            {shares.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No shares yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
