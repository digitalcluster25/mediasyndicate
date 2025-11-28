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
import { RefreshCw, Edit, Trash2, CheckCircle, XCircle, Calendar, Globe } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  type: string;
  url: string | null;
  isActive: boolean;
  articlesCount: number;
  lastImportAt: string | null;
}

export function SourceTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [importingId, setImportingId] = useState<string | null>(null);

  // Fetch sources
  const { data, isLoading, error } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sources', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch sources');
      }
      const json = await res.json();
      return json;
    },
    staleTime: 0,
    refetchOnMount: true
  });

  // Manual import mutation
  const importMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      setImportingId(sourceId);
      const res = await fetch(`/api/admin/sources/${sourceId}/import`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Import failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Import successful',
        description: `Imported ${data.imported} articles in ${data.duration}s`
      });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: 'Could not import articles'
      });
    },
    onSettled: () => {
      setImportingId(null);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      const res = await fetch(`/api/admin/sources/${sourceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Source deleted',
        description: 'Source removed successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
    }
  });

  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-center">
        <p className="text-slate-600">Загрузка источников...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <p className="text-slate-950 font-semibold">Ошибка загрузки источников</p>
        <p className="text-slate-600 text-sm mt-1">
          {error instanceof Error ? error.message : 'Неизвестная ошибка'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-slate-200 hover:bg-slate-100"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['sources'] })}
        >
          Повторить
        </Button>
      </div>
    );
  }

  if (!data?.sources) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4 text-center text-slate-600">
        Нет данных. Попробуйте обновить страницу.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200">
            <TableHead className="text-slate-950">Название</TableHead>
            <TableHead className="text-slate-950">Тип</TableHead>
            <TableHead className="text-slate-950">URL</TableHead>
            <TableHead className="text-slate-950">Статус</TableHead>
            <TableHead className="text-slate-950">Статистика</TableHead>
            <TableHead className="text-slate-950">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.sources.map((source: Source) => (
            <TableRow key={source.id} className="border-slate-200 hover:bg-slate-50">
              <TableCell className="font-medium text-slate-950">{source.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {source.type}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate text-slate-600">
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {source.url || '-'}
                </div>
              </TableCell>
              <TableCell>
                {source.isActive ? (
                  <Badge className="bg-green-500 text-white flex items-center gap-1 w-fit">
                    <CheckCircle className="h-3 w-3" />
                    Активен
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                    <XCircle className="h-3 w-3" />
                    Отключен
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-950">{source.articlesCount}</span>
                    <span>статей</span>
                  </div>
                  {source.lastImportAt && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(source.lastImportAt).toLocaleString('ru')}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-100"
                    onClick={() => importMutation.mutate(source.id)}
                    disabled={importingId === source.id}
                    title="Импортировать"
                  >
                    <RefreshCw className={`h-4 w-4 ${importingId === source.id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 hover:bg-slate-100"
                    onClick={() => {
                      // TODO: Edit functionality
                      toast({ title: 'Edit coming soon' });
                    }}
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Удалить этот источник?')) {
                        deleteMutation.mutate(source.id);
                      }
                    }}
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
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

