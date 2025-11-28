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
import { CheckCircle, XCircle, Globe, Radio } from 'lucide-react';

const schema = z.object({
  name: z.string().min(3, 'Минимум 3 символа').max(100),
  type: z.enum(['RSS', 'TELEGRAM']),
  url: z.string().min(1, 'Обязательное поле'),
  isActive: z.boolean()
}).refine((data) => {
  if (data.type === 'RSS') {
    try {
      new URL(data.url);
      return true;
    } catch {
      return false;
    }
  }
  // Для Telegram принимаем @username или https://t.me/username
  return data.url.startsWith('@') || data.url.startsWith('https://t.me/') || data.url.length > 0;
}, {
  message: 'Для RSS нужен валидный URL, для Telegram - @username или https://t.me/username',
  path: ['url']
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
    const type = form.getValues('type');
    
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Введите URL или username'
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
        body: JSON.stringify({ url, type })
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
            <Label htmlFor="type">Тип источника *</Label>
            <select
              id="type"
              {...form.register('type')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="RSS">RSS Feed</option>
              <option value="TELEGRAM">Telegram канал</option>
            </select>
          </div>

          <div>
            <Label htmlFor="url">
              {form.watch('type') === 'TELEGRAM' ? 'Telegram канал *' : 'RSS Feed URL *'}
            </Label>
            <Input
              id="url"
              {...form.register('url')}
              placeholder={
                form.watch('type') === 'TELEGRAM' 
                  ? "@uniannet или https://t.me/uniannet"
                  : "https://www.kyivpost.com/feed"
              }
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
            className="w-full border-slate-200 hover:bg-slate-100"
          >
            {testing ? (
              <>
                <Radio className="h-4 w-4 mr-2 animate-spin" />
                Тестирование...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Тест подключения
              </>
            )}
          </Button>

          {testResult && (
            <div
              className={`p-3 rounded border ${
                testResult.success
                  ? 'bg-green-50 text-green-900 border-green-200'
                  : 'bg-red-50 text-red-900 border-red-200'
              }`}
            >
              {testResult.success ? (
                <>
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Фид работает!
                  </p>
                  <p className="text-sm">
                    Найдено {testResult.itemsFound} статей
                  </p>
                  {testResult.sample && (
                    <p className="text-sm text-slate-600 mt-1">
                      Пример: {testResult.sample.title}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Ошибка
                  </p>
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

