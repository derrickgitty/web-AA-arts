"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "./Avatar";

type Props = { displayName: string; avatarUrl: string | null };

export default function Header({ displayName, avatarUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-white/60 border-b border-white/80">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl text-lilac-500">
          <span className="text-2xl">🎨</span>
          <span>Art Portal</span>
        </Link>
        <div className="flex items-center gap-2 relative">
          <Link href="/explore" className="btn-ghost">👀 Explore</Link>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 hover:opacity-80">
            <Avatar src={avatarUrl} name={displayName} size={36} />
            <span className="hidden sm:inline text-sm text-gray-600">{displayName}</span>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 card p-2 min-w-[180px] z-20">
                <Link href="/change-password" className="block px-3 py-2 rounded-xl hover:bg-blush-50 text-sm" onClick={() => setOpen(false)}>
                  🔒 Change password
                </Link>
                <button onClick={logout} className="w-full text-left block px-3 py-2 rounded-xl hover:bg-blush-50 text-sm text-blush-500">
                  👋 Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
