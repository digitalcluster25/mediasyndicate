'use client';

import Link from 'next/link';

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/adminko/sources" className="text-xl font-bold">
                MediaSyndicate Admin
              </Link>
              <nav className="flex gap-4">
                <Link 
                  href="/adminko/sources" 
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Источники
                </Link>
                <Link 
                  href="/adminko/prompts" 
                  className="text-sm text-gray-900 font-medium"
                >
                  Промпты
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">dev-mode</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

