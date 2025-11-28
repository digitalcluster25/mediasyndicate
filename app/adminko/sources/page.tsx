'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SourceTable } from './components/SourceTable';
import { SourceForm } from './components/SourceForm';

export default function SourcesPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Управление источниками</h1>
          <p className="text-slate-600 mt-1">
            Добавляйте и управляйте RSS и Telegram источниками
          </p>
        </div>
        <Button 
          onClick={() => setFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить источник
        </Button>
      </div>

      <SourceTable />
      <SourceForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

