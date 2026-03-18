import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md border border-line p-8 bg-bg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] text-center">
        <h1 className="text-4xl font-mono font-bold tracking-tighter mb-4 text-red-600">ACCESS_DENIED</h1>
        <p className="font-mono mb-8 opacity-70">
          You do not have the required administrative privileges to access this system.
        </p>
        <Link 
          href="/login"
          className="inline-block bg-ink text-bg px-6 py-3 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
