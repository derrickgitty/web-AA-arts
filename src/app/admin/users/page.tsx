import { getDb, STORAGE_QUOTA_BYTES } from "@/lib/db";
import ResetPasswordButton from "@/components/admin/ResetPasswordButton";

type Row = {
  id: number;
  username: string;
  display_name: string;
  role: "kid" | "admin";
  storage_bytes: number;
  must_change_password: number;
  artworks: number;
};

export default function AdminUsersPage() {
  const users = getDb()
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.role, u.storage_bytes, u.must_change_password,
        (SELECT COUNT(*) FROM artworks a JOIN galleries g ON g.id = a.gallery_id WHERE g.user_id = u.id) as artworks
       FROM users u ORDER BY u.role DESC, u.username`
    )
    .all() as Row[];

  return (
    <>
      <h1 className="font-display text-3xl text-lilac-500 mb-6">👧 Users</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-blush-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Artworks</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const pct = u.role === "kid" ? Math.min(100, Math.round((u.storage_bytes / STORAGE_QUOTA_BYTES) * 100)) : 0;
              return (
                <tr key={u.id} className="border-t border-blush-50">
                  <td className="px-4 py-3 font-mono text-sm">{u.username}</td>
                  <td className="px-4 py-3">{u.display_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.role === "admin" ? "bg-lilac-100 text-lilac-500" : "bg-mint-100 text-mint-500"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{u.artworks}</td>
                  <td className="px-4 py-3 text-sm">
                    {u.role === "kid" ? (
                      <div className="w-32">
                        <div className="text-xs text-gray-500 mb-1">{(u.storage_bytes / 1024 / 1024).toFixed(1)}MB / 500MB</div>
                        <div className="bg-blush-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-lilac-400 h-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.must_change_password ? (
                      <span className="text-blush-500">Must reset password</span>
                    ) : (
                      <span className="text-gray-400">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ResetPasswordButton userId={u.id} username={u.username} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
