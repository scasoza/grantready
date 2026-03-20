import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-warm-50 text-warm-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold">
            G
          </div>
          <span className="text-xl font-semibold text-warm-900">GrantReady</span>
        </div>

        <p className="text-6xl font-extrabold text-warm-200">404</p>
        <h1 className="text-xl text-warm-500">Page not found</h1>
        <p className="text-sm text-warm-400">
          The page you are looking for does not exist or has been moved.
        </p>

        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
