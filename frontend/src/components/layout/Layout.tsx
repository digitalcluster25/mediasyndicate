import { Link, Outlet } from 'react-router-dom';
import { BarChart3, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <BarChart3 className="h-6 w-6" />
            <span>TG Rating</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Рейтинг
            </Link>
            <Link to="/channels" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Каталог
            </Link>
            <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              О проекте
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/channels?search=">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Поиск</span>
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Админ</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-500">
          <p>TG Rating Board &copy; {new Date().getFullYear()} — независимый рейтинг Telegram-каналов</p>
        </div>
      </footer>
    </div>
  );
}
