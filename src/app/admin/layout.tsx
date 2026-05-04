import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password?forced=1");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/admin" className="font-display text-xl text-lilac-500 flex items-center gap-2">
            <span>🛠</span> Admin
          </Link>
          <nav className="flex gap-1 flex-wrap">
            <Link href="/admin/users" className="btn-ghost">👧 Users</Link>
            <Link href="/admin/logins" className="btn-ghost">🔑 Logins</Link>
            <Link href="/admin/shares" className="btn-ghost">💌 Shares</Link>
            <Link href="/admin/audit" className="btn-ghost">📜 Audit</Link>
            <Link href="/change-password" className="btn-ghost text-gray-400">Change my password</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
