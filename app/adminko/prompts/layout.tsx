'use client';

import Link from 'next/link';
import { Home, List, MessageSquare, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/adminko/sources" className="flex items-center gap-2 text-xl font-bold text-slate-950">
                <Home className="h-5 w-5" />
                MediaSyndicate Admin
              </Link>
              <nav className="flex gap-1">
                <Link 
                  href="/adminko/sources" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <List className="h-4 w-4" />
                  Источники
                </Link>
                <Link 
                  href="/adminko/prompts" 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-950 bg-slate-100 rounded-md"
                >
                  <MessageSquare className="h-4 w-4" />
                  Промпты
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Globe className="h-4 w-4 mr-2" />
                  View Site
                </Button>
              </Link>
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <Settings className="h-4 w-4" />
                dev-mode
              </span>
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

