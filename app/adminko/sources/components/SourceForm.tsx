'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().min(3, 'Минимум 3 символа').max(100),
  type: z.enum(['RSS', 'TELEGRAM']),
  url: z.string().url('Неверный формат URL'),
  isActive: z.boolean()
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceForm({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'RSS',
      url: '',
      isActive: true
    }
  });

  // Test connection
  const handleTest = async () => {
    const url = form.getValues('url');
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Введите URL'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Network error'
      });
    } finally {
      setTesting(false);
    }
  };

  // Create source
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create source');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Источник добавлен',
        description: 'Новый источник успешно создан'
      });
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      onOpenChange(false);
      form.reset();
      setTestResult(null);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить источник</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data as FormData))} className="space-y-4">
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Kyiv Post"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="url">RSS Feed URL *</Label>
            <Input
              id="url"
              {...form.register('url')}
              placeholder="https://www.kyivpost.com/feed"
            />
            {form.formState.errors.url && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
            className="w-full"
          >
            {testing ? '⏳ Тестирование...' : '🧪 Тест подключения'}
          </Button>

          {testResult && (
            <div
              className={`p-3 rounded ${
                testResult.success
                  ? 'bg-green-50 text-green-900'
                  : 'bg-red-50 text-red-900'
              }`}
            >
              {testResult.success ? (
                <>
                  <p className="font-semibold">✅ Фид работает!</p>
                  <p className="text-sm">
                    Найдено {testResult.itemsFound} статей
                  </p>
                  {testResult.sample && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Пример: {testResult.sample.title}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold">❌ Ошибка</p>
                  <p className="text-sm">{testResult.error}</p>
                </>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Активировать сразу</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
                setTestResult(null);
              }}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? '⏳ Добавление...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

