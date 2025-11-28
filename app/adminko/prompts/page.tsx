'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PromptTable } from './components/PromptTable';
import { PromptForm } from './components/PromptForm';

export default function PromptsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Управление AI промптами</h1>
          <p className="text-gray-600 mt-1">
            Создавайте и редактируйте промпты для AI анализа статей
          </p>
        </div>
        <Button onClick={() => {
          setEditingPrompt(null);
          setFormOpen(true);
        }}>
          + Создать промпт
        </Button>
      </div>

      <PromptTable onEdit={(prompt) => {
        setEditingPrompt(prompt);
        setFormOpen(true);
      }} />
      <PromptForm 
        open={formOpen} 
        onOpenChange={setFormOpen}
        prompt={editingPrompt}
        onSuccess={() => {
          setEditingPrompt(null);
          setFormOpen(false);
        }}
      />
    </div>
  );
}

