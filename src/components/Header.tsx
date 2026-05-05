"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "./Avatar";

type Theme = "pastel" | "berry" | "lavender" | "forest";

type Props = { displayName: string; avatarUrl: string | null; theme: Theme };

const THEME_OPTIONS: { value: Theme; label: string; swatch: string }[] = [
  { value: "pastel",   label: "Pastel",   swatch: "linear-gradient(135deg, #FFD6E8, #E8D5FF, #D5F5E3)" },
  { value: "berry",    label: "Berry",    swatch: "linear-gradient(135deg, #FFB8D4, #FFD6E8, #FFF1DE)" },
  { value: "lavender", label: "Lavender", swatch: "linear-gradient(135deg, #D4B8FF, #E8D5FF, #FFE4ED)" },
  { value: "forest",   label: "Forest",   swatch: "linear-gradient(135deg, #A8E6C5, #D5F5E3, #EFE6FF)" },
];

export default function Header({ displayName, avatarUrl, theme }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Theme>(theme);
  const [saving, setSaving] = useState(false);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function pickTheme(value: Theme) {
    if (value === active || saving) return;
    setSaving(true);
    // Optimistic: update immediately so the user sees the change before the round-trip.
    document.documentElement.dataset.theme = value;
    setActive(value);
    const res = await fetch("/api/me/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: value }),
    });
    setSaving(false);
    if (!res.ok) {
      document.documentElement.dataset.theme = theme;
      setActive(theme);
      alert("Couldn't save that theme — try again.");
    } else {
      router.refresh();
    }
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
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 hover:opacity-80" aria-haspopup="menu" aria-expanded={open}>
            <Avatar src={avatarUrl} name={displayName} size={36} />
            <span className="hidden sm:inline text-sm text-gray-600">{displayName}</span>
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 card p-2 min-w-[220px] z-20">
                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Theme</div>
                <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => pickTheme(t.value)}
                      disabled={saving}
                      aria-pressed={active === t.value}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm hover:bg-blush-50 disabled:opacity-60 ${active === t.value ? "ring-2 ring-lilac-300" : ""}`}
                    >
                      <span aria-hidden="true" className="inline-block w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundImage: t.swatch }} />
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="my-1 h-px bg-gray-100" />
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
