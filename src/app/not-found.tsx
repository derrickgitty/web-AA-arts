import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-10 w-full max-w-md text-center">
        <div className="font-display text-7xl text-lilac-400 mb-2">404</div>
        <h1 className="font-display text-2xl text-lilac-500 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">
          That link doesn&rsquo;t go anywhere. Maybe a share was revoked, or the
          gallery was moved.
        </p>
        <Link href="/" className="btn-primary justify-center">
          Back to safety
        </Link>
      </div>
    </main>
  );
}
