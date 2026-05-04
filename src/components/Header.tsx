"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header({ displayName }: { displayName: string }) {
  const router = useRouter();
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
        <div className="flex items-center gap-2">
          <Link href="/explore" className="btn-ghost">👀 Explore</Link>
          <span className="hidden sm:inline text-sm text-gray-500 ml-2">Hi, {displayName}!</span>
          <button onClick={logout} className="btn-ghost text-gray-400 hover:text-blush-500">Sign out</button>
        </div>
      </div>
    </header>
  );
}
