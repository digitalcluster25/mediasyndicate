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
  const { data, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sources');
      if (!res.ok) throw new Error('Failed to fetch sources');
      return res.json();
    }
  });

  // Manual import mutation
  const importMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      setImportingId(sourceId);
      const res = await fetch(`/api/admin/sources/${sourceId}/import`, {
        method: 'POST'
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
        method: 'DELETE'
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Статистика</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.sources.map((source: Source) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">{source.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{source.type}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {source.url || '-'}
              </TableCell>
              <TableCell>
                {source.isActive ? (
                  <Badge className="bg-green-500">🟢 Активен</Badge>
                ) : (
                  <Badge variant="destructive">🔴 Отключен</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{source.articlesCount} статей</div>
                  {source.lastImportAt && (
                    <div className="text-muted-foreground text-xs">
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
                    onClick={() => importMutation.mutate(source.id)}
                    disabled={importingId === source.id}
                  >
                    {importingId === source.id ? '⏳' : '🔄'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Edit functionality
                      toast({ title: 'Edit coming soon' });
                    }}
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Удалить этот источник?')) {
                        deleteMutation.mutate(source.id);
                      }
                    }}
                  >
                    🗑️
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

