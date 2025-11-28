'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Prompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  content: string;
  variables: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromptTableProps {
  onEdit: (prompt: Prompt) => void;
}

export function PromptTable({ onEdit }: PromptTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch prompts
  const { data, isLoading, error } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/prompts', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch prompts');
      }
      const json = await res.json();
      return json;
    },
    staleTime: 0,
    refetchOnMount: true
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/admin/prompts/${key}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete prompt');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Успешно',
        description: 'Промпт удален',
      });
      setDeletingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
      setDeletingId(null);
    }
  });

  const handleDelete = async (key: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот промпт?')) {
      return;
    }
    setDeletingId(key);
    deleteMutation.mutate(key);
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка промптов...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const prompts: Prompt[] = data?.prompts || [];

  if (prompts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Промпты не найдены. Создайте первый промпт.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ключ</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead>Переменные</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Обновлен</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell className="font-mono text-sm">{prompt.key}</TableCell>
              <TableCell className="font-medium">{prompt.name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {prompt.description || '-'}
              </TableCell>
              <TableCell>
                {prompt.variables && Object.keys(prompt.variables).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(prompt.variables).map((key) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={prompt.isActive ? 'default' : 'secondary'}>
                  {prompt.isActive ? 'Активен' : 'Неактивен'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(prompt.updatedAt).toLocaleDateString('ru-RU')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(prompt)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(prompt.key)}
                    disabled={deletingId === prompt.key}
                  >
                    {deletingId === prompt.key ? 'Удаление...' : 'Удалить'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

