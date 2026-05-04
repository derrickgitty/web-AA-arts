"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }
    // Server redirects to change-password if must_change_password=1; just route to /.
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-10 w-full max-w-md">
        <div className="text-6xl text-center mb-3">🎨</div>
        <h1 className="font-display text-3xl text-center text-lilac-500 mb-1">Welcome Back!</h1>
        <p className="text-center text-gray-500 mb-7">Sign in to your art portal ✨</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-lilac-500 mb-1">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-lilac-500 mb-1">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-blush-500 text-sm text-center">💔 {error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
            {loading ? "Signing in…" : "Sign In ✨"}
          </button>
        </form>
      </div>
    </main>
  );
}
