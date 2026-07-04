import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, X, ShieldAlert, LogOut, Lock } from 'lucide-react';

const API = '/api/admin';

function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

function setToken(token: string) {
  localStorage.setItem('admin_token', token);
}

function clearToken() {
  localStorage.removeItem('admin_token');
}

async function fetchAuth<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${url}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

interface QueueEntry {
  id: number;
  username: string;
  title: string;
  description: string | null;
  categoryId: number | null;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());

  if (!isLoggedIn) {
    return <LoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return <ModerationQueue onLogout={() => { clearToken(); setIsLoggedIn(false); }} />;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка входа');
      } else {
        setToken(data.token);
        onLogin();
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle>Админ-панель</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Пароль администратора"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ModerationQueue({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: () => fetchAuth<QueueEntry[]>('/queue'),
    refetchInterval: 30000,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetchAuth(`/moderate/${id}`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Модерация</h1>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-1" /> Выйти
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !queue || queue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Очередь модерации пуста. Отправьте /add @username боту @mediasyndicate_parser_bot
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                    <p className="text-sm text-gray-500">@{entry.username}</p>
                    {entry.description && <p className="text-sm text-gray-600 mt-1">{entry.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.createdAt).toLocaleString()}
                      <Badge className="ml-2">{entry.status}</Badge>
                    </p>
                  </div>
                  {entry.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => moderateMutation.mutate({ id: entry.id, status: 'approved' })}
                        disabled={moderateMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Одобрить
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moderateMutation.mutate({ id: entry.id, status: 'rejected' })}
                        disabled={moderateMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" /> Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
