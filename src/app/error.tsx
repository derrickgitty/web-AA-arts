"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-10 w-full max-w-md text-center">
        <div className="font-display text-6xl text-blush-400 mb-2">Oops</div>
        <h1 className="font-display text-2xl text-lilac-500 mb-2">
          Something went sideways
        </h1>
        <p className="text-gray-500 mb-6">
          Try again in a moment. If it keeps happening, tell an adult.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <a href="/" className="btn-secondary">
            Home
          </a>
        </div>
      </div>
    </main>
  );
}
