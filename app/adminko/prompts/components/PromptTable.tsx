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
import { Edit, Trash2, CheckCircle, XCircle, Tag, Calendar } from 'lucide-react';

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
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-center">
        <p className="text-slate-600">Загрузка промптов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-center">
        <p className="text-slate-600">
          Ошибка загрузки: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const prompts: Prompt[] = data?.prompts || [];

  if (prompts.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-center text-slate-600">
        Промпты не найдены. Создайте первый промпт.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead className="text-slate-950">Ключ</TableHead>
            <TableHead className="text-slate-950">Название</TableHead>
            <TableHead className="text-slate-950">Описание</TableHead>
            <TableHead className="text-slate-950">Переменные</TableHead>
            <TableHead className="text-slate-950">Статус</TableHead>
            <TableHead className="text-slate-950">Обновлен</TableHead>
            <TableHead className="text-right text-slate-950">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.id} className="border-slate-200 hover:bg-slate-50">
              <TableCell className="font-mono text-sm text-slate-950">{prompt.key}</TableCell>
              <TableCell className="font-medium text-slate-950">{prompt.name}</TableCell>
              <TableCell className="max-w-xs truncate text-slate-600">
                {prompt.description || '-'}
              </TableCell>
              <TableCell>
                {prompt.variables && Object.keys(prompt.variables).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(prompt.variables).map((key) => (
                      <Badge key={key} variant="outline" className="text-xs border-slate-200 bg-slate-50 text-slate-700">
                        <Tag className="h-3 w-3 mr-1" />
                        {key}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={prompt.isActive ? 'default' : 'secondary'}
                  className={prompt.isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}
                >
                  {prompt.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Активен
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Неактивен
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(prompt.updatedAt).toLocaleDateString('ru-RU')}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-100"
                    onClick={() => onEdit(prompt)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Редактировать
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(prompt.key)}
                    disabled={deletingId === prompt.key}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
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

