'use client';
import Link from 'next/link';

export function PublicNav() {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo left */}
        <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
          MEDIA SYNDICATE
        </Link>
        
        {/* Nav right */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Live Rating
          </Link>
        </div>
      </div>
    </nav>
  );
}


