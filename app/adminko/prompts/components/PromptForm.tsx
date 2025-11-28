'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

const schema = z.object({
  key: z.string().min(1, 'Обязательное поле').regex(/^[a-z0-9_]+$/, 'Только строчные буквы, цифры и подчеркивания'),
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  content: z.string().min(1, 'Обязательное поле'),
  isActive: z.boolean()
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: any;
  onSuccess?: () => void;
}

export function PromptForm({ open, onOpenChange, prompt, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: '',
      name: '',
      description: '',
      content: '',
      isActive: true
    }
  });

  // Заполнить форму при редактировании
  useEffect(() => {
    if (prompt && open) {
      form.reset({
        key: prompt.key,
        name: prompt.name,
        description: prompt.description || '',
        content: prompt.content,
        isActive: prompt.isActive
      });
    } else if (!prompt && open) {
      form.reset({
        key: '',
        name: '',
        description: '',
        content: '',
        isActive: true
      });
    }
  }, [prompt, open, form]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = prompt 
        ? `/api/admin/prompts/${prompt.key}`
        : '/api/admin/prompts';
      
      const method = prompt ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save prompt');
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: prompt ? 'Промпт обновлен' : 'Промпт создан',
        description: prompt ? 'Изменения сохранены' : 'Новый промпт успешно создан'
      });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error.message
      });
    }
  });

  const isEditing = !!prompt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать промпт' : 'Создать промпт'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="key">
                Ключ (key) *
                {!isEditing && (
                  <span className="text-xs text-gray-500 ml-2">
                    (только строчные буквы, цифры, подчеркивания)
                  </span>
                )}
              </Label>
              <Input
                id="key"
                {...form.register('key')}
                placeholder="analyze_article"
                disabled={isEditing}
                className="font-mono"
              />
              {form.formState.errors.key && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.key.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Анализ статьи"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Краткое описание промпта"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="content">
              Содержание промпта *
              <span className="text-xs text-gray-500 ml-2">
                (используйте {'{{'}variable{'}}'} для переменных)
              </span>
            </Label>
            <Textarea
              id="content"
              {...form.register('content')}
              placeholder="Ты - эксперт по анализу новостей...&#10;&#10;Статья:&#10;Заголовок: {{title}}&#10;Содержание: {{content}}"
              rows={12}
              className="font-mono text-sm"
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Активен</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 hover:bg-slate-100"
              onClick={() => {
                onOpenChange(false);
                form.reset();
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending 
                ? 'Сохранение...' 
                : isEditing 
                  ? 'Сохранить изменения' 
                  : 'Создать промпт'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

