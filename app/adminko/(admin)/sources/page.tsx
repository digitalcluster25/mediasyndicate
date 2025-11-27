'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SourceTable } from './components/SourceTable';
import { SourceForm } from './components/SourceForm';

export default function SourcesPage() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Управление источниками</h1>
          <p className="text-gray-600 mt-1">
            Добавляйте и управляйте RSS и Telegram источниками
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          + Добавить источник
        </Button>
      </div>

      <SourceTable />
      <SourceForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

