import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ShieldAlert } from 'lucide-react';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, options);
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
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('admin');
  const [message, setMessage] = useState('');

  // Simple auth placeholder — in production use real auth
  if (status !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Админ-панель</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              placeholder="Пароль администратора"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && message.length > 0 && setStatus('admin')}
            />
            <Button className="w-full" onClick={() => message.length > 0 && setStatus('admin')}>Войти</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ModerationQueue />;
}

function ModerationQueue() {
  const queryClient = useQueryClient();

  const { data: queue, isLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: () => fetchJSON<QueueEntry[]>('/admin/queue', { headers: { 'x-admin-password': 'admin' } }),
    refetchInterval: 30000,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetchJSON(`/admin/moderate/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Модерация</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !queue || queue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Очередь модерации пуста.
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
                      Добавлен: {new Date(entry.createdAt).toLocaleString()}
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
