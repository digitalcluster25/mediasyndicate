'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';

interface RatingSettings {
  id: string;
  key: string;
  name: string;
  viewsWeight: number;
  forwardsWeight: number;
  reactionsWeight: number;
  repliesWeight: number;
  agePenalty: number;
  minRating: number | null;
  maxAgeHours: number | null;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export default function RatingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<RatingSettings | null>(null);

  const [formData, setFormData] = useState({
    viewsWeight: 0.05,
    forwardsWeight: 8.0,
    reactionsWeight: 3.0,
    repliesWeight: 5.0,
    agePenalty: 2.0,
    minRating: 0,
    maxAgeHours: null as number | null,
    description: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/admin/rating-settings', {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await res.json();
      setSettings(data);
      setFormData({
        viewsWeight: data.viewsWeight,
        forwardsWeight: data.forwardsWeight,
        reactionsWeight: data.reactionsWeight,
        repliesWeight: data.repliesWeight,
        agePenalty: data.agePenalty,
        minRating: data.minRating ?? 0,
        maxAgeHours: data.maxAgeHours,
        description: data.description ?? ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/rating-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      const data = await res.json();
      setSettings(data.settings);
      setSuccess(true);
      
      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Настройки рейтинга</h1>
        <p className="text-slate-600 mt-1">
          Настройте формулу расчета рейтинга статей. Изменения применяются при следующем пересчете.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Настройки успешно сохранены!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Веса метрик</h2>
          <p className="text-sm text-slate-600 mb-4">
            Формула: Rating = (Views × Views Weight) + (Forwards × Forwards Weight) + 
            (Reactions × Reactions Weight) + (Replies × Replies Weight) - (Age × Age Penalty)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="viewsWeight">Views Weight</Label>
              <Input
                id="viewsWeight"
                type="number"
                step="0.01"
                value={formData.viewsWeight}
                onChange={(e) => setFormData({ ...formData, viewsWeight: parseFloat(e.target.value) })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Вес просмотров (по умолчанию: 0.05)</p>
            </div>

            <div>
              <Label htmlFor="forwardsWeight">Forwards Weight</Label>
              <Input
                id="forwardsWeight"
                type="number"
                step="0.01"
                value={formData.forwardsWeight}
                onChange={(e) => setFormData({ ...formData, forwardsWeight: parseFloat(e.target.value) })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Вес пересылок (по умолчанию: 8.0)</p>
            </div>

            <div>
              <Label htmlFor="reactionsWeight">Reactions Weight</Label>
              <Input
                id="reactionsWeight"
                type="number"
                step="0.01"
                value={formData.reactionsWeight}
                onChange={(e) => setFormData({ ...formData, reactionsWeight: parseFloat(e.target.value) })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Вес реакций (по умолчанию: 3.0)</p>
            </div>

            <div>
              <Label htmlFor="repliesWeight">Replies Weight</Label>
              <Input
                id="repliesWeight"
                type="number"
                step="0.01"
                value={formData.repliesWeight}
                onChange={(e) => setFormData({ ...formData, repliesWeight: parseFloat(e.target.value) })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Вес комментариев (по умолчанию: 5.0)</p>
            </div>

            <div>
              <Label htmlFor="agePenalty">Age Penalty</Label>
              <Input
                id="agePenalty"
                type="number"
                step="0.01"
                value={formData.agePenalty}
                onChange={(e) => setFormData({ ...formData, agePenalty: parseFloat(e.target.value) })}
                required
              />
              <p className="text-xs text-slate-500 mt-1">Штраф за возраст в часах (по умолчанию: 2.0)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Дополнительные настройки</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minRating">Минимальный рейтинг</Label>
              <Input
                id="minRating"
                type="number"
                step="0.01"
                value={formData.minRating}
                onChange={(e) => setFormData({ ...formData, minRating: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-slate-500 mt-1">Минимальное значение рейтинга (0 = без ограничения)</p>
            </div>

            <div>
              <Label htmlFor="maxAgeHours">Максимальный возраст (часы)</Label>
              <Input
                id="maxAgeHours"
                type="number"
                value={formData.maxAgeHours ?? ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxAgeHours: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
              <p className="text-xs text-slate-500 mt-1">Максимальный возраст статьи (пусто = без ограничения)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <Label htmlFor="description">Описание</Label>
          <textarea
            id="description"
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание настроек (опционально)"
          />
        </div>

        {settings && (
          <div className="text-xs text-slate-500 border-t border-slate-200 pt-4">
            Последнее обновление: {new Date(settings.updatedAt).toLocaleString('ru-RU')}
            {settings.updatedBy && ` (${settings.updatedBy})`}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={loadSettings}
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </div>
  );
}

