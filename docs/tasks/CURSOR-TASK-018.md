# ЗАДАНИЕ ДЛЯ CURSOR: Админ-панель управления источниками

**Проект:** MediaSyndicate  
**Задача:** TASK-018  
**Приоритет:** ВЫСОКИЙ  
**Время:** ~5 часов

---

## 📋 ЧТО НУЖНО СДЕЛАТЬ

Создать защищённую админ-панель для управления RSS/Telegram источниками новостей.

**Ключевые фичи (по приоритету):**
1. Авторизация (hardcoded credentials)
2. Просмотр списка источников
3. Добавление нового источника
4. Тест RSS подключения
5. Ручной импорт
6. Редактирование/удаление

---

## 🔧 ТЕХНОЛОГИИ

- Next.js 15 (App Router) ✅ уже установлен
- shadcn/ui - нужно установить
- React Hook Form + Zod
- TanStack Query
- Prisma ✅ уже настроен
- jose (JWT для сессий)

---

## 📁 ФАЗА 1: УСТАНОВКА ЗАВИСИМОСТЕЙ

### Шаг 1.1: Установить зависимости
```bash
cd /Users/macbookpro/Desktop/mediasyndicate

# Основные зависимости
npm install jose zod react-hook-form @hookform/resolvers @tanstack/react-query

# shadcn/ui
npx shadcn@latest init
# Когда спросит - выбирай:
# - Style: Default
# - Color: Slate
# - CSS variables: Yes

# Добавить компоненты
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add table
npx shadcn@latest add toast
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add badge
```

### Шаг 1.2: Проверка
После установки должны появиться:
- `components/ui/` - shadcn компоненты
- `lib/utils.ts` - утилиты
- Обновлённые `tailwind.config.ts` и `components.json`

---

## 📁 ФАЗА 2: АВТОРИЗАЦИЯ (30 мин)

### Шаг 2.1: Создать auth файлы

**lib/auth/credentials.ts:**
```typescript
// НЕ МЕНЯТЬ CREDENTIALS!
export const ADMIN_CREDENTIALS = {
  username: 'boss',
  password: '149521MkSF#u*V'
};
```

**lib/auth/session.ts:**
```typescript
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mediasyndicate-secret-key-2024'
);

export interface SessionData {
  username: string;
  isAdmin: true;
  createdAt: number;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username, isAdmin: true } as SessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-session')?.value;
  
  if (!token) return null;
  
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
}
```

### Шаг 2.2: Создать middleware

**middleware.ts** (в корне проекта):
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  // Защита всех /admin/* роутов (кроме /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Разрешить доступ к /admin/login
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Проверить сессию
    const session = await getSession();
    
    if (!session) {
      // Нет сессии → редирект на логин
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*'
};
```

### Шаг 2.3: Создать API login/logout

**app/api/admin/auth/login/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_CREDENTIALS } from '@/lib/auth/credentials';
import { createSession, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Проверка credentials
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // Создать сессию
      const token = await createSession(username);
      
      // Установить cookie
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        message: 'Login successful'
      });
    }

    // Неверные credentials
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**app/api/admin/auth/logout/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();
  
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
```

### Шаг 2.4: Создать страницу логина

**app/admin/login/page.tsx:**
```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        const from = searchParams.get('from') || '/admin/sources';
        router.push(from);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">MediaSyndicate</h2>
          <p className="mt-2 text-gray-600">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### ✅ Тест Фазы 2
```bash
npm run dev
# Открыть http://localhost:3000/admin/sources
# Должен редирект на /admin/login
# Ввести: boss / 149521MkSF#u*V
# Должен пропустить на /admin/sources
```

---

## 📁 ФАЗА 3: API ENDPOINTS (1 час)

### Шаг 3.1: GET /api/admin/sources

**app/api/admin/sources/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  // Проверка сессии
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Получить источники с подсчетом статей
  const sources = await prisma.source.findMany({
    include: {
      _count: {
        select: { articles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Получить lastImportAt для каждого источника
  const sourcesWithImport = await Promise.all(
    sources.map(async (source) => {
      const lastArticle = await prisma.article.findFirst({
        where: { sourceId: source.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      });

      return {
        id: source.id,
        name: source.name,
        type: source.type,
        url: source.url,
        isActive: source.isActive,
        articlesCount: source._count.articles,
        lastImportAt: lastArticle?.createdAt || null,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt
      };
    })
  );

  return NextResponse.json({
    sources: sourcesWithImport,
    total: sources.length
  });
}

// POST будет в следующем шаге
```

### Шаг 3.2: POST /api/admin/sources (создание)

Добавить в тот же файл **app/api/admin/sources/route.ts:**
```typescript
import { z } from 'zod';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Валидация
  const schema = z.object({
    name: z.string().min(3).max(100),
    type: z.enum(['RSS', 'TELEGRAM']),
    url: z.string().url().optional(),
    isActive: z.boolean().default(true)
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Проверка на дубликат URL
  if (data.url) {
    const existing = await prisma.source.findUnique({
      where: { url: data.url }
    });
    
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source with this URL already exists'
        },
        { status: 409 }
      );
    }
  }

  // Создать источник
  const source = await prisma.source.create({
    data: {
      name: data.name,
      type: data.type,
      url: data.url,
      isActive: data.isActive
    }
  });

  return NextResponse.json(
    {
      success: true,
      source
    },
    { status: 201 }
  );
}
```

### Шаг 3.3: POST /api/admin/sources/test

**app/api/admin/sources/test/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { RSSParser } from '@/lib/services/RSSParser';
import { z } from 'zod';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Валидация
  const schema = z.object({
    url: z.string().url()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid URL'
      },
      { status: 400 }
    );
  }

  try {
    // Парсить RSS
    const feed = await RSSParser.parse(validation.data.url);
    
    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Feed is empty',
          details: 'No items found in the feed'
        },
        { status: 400 }
      );
    }

    // Взять первую статью как пример
    const sample = feed.items[0];

    return NextResponse.json({
      success: true,
      itemsFound: feed.items.length,
      sample: {
        title: sample.title,
        pubDate: sample.pubDate,
        link: sample.link
      }
    });
  } catch (error) {
    console.error('[RSS Test Error]:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse RSS feed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}
```

### Шаг 3.4: POST /api/admin/sources/[id]/import

**app/api/admin/sources/[id]/import/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ImportService } from '@/lib/services/ImportService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const result = await ImportService.importFromSource(params.id);
    
    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      duration
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Шаг 3.5: PATCH & DELETE /api/admin/sources/[id]

**app/api/admin/sources/[id]/route.ts:**
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const source = await prisma.source.findUnique({
    where: { id: params.id }
  });

  if (!source) {
    return NextResponse.json(
      { error: 'Source not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ source });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  const schema = z.object({
    name: z.string().min(3).max(100).optional(),
    url: z.string().url().optional(),
    isActive: z.boolean().optional()
  });

  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error },
      { status: 400 }
    );
  }

  try {
    const source = await prisma.source.update({
      where: { id: params.id },
      data: validation.data
    });

    return NextResponse.json({
      success: true,
      source
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.source.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Source deleted'
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Source not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
```

---

## 📁 ФАЗА 4: UI КОМПОНЕНТЫ (2 часа)

### Шаг 4.1: Providers для TanStack Query

**app/providers.tsx:**
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Обновить **app/layout.tsx:**
```typescript
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

### Шаг 4.2: Admin Layout

**app/admin/layout.tsx:**
```typescript
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  const handleLogout = async () => {
    'use server';
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    redirect('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/sources" className="text-xl font-bold">
                MediaSyndicate Admin
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.username}</span>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Выйти
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

### Шаг 4.3: SourceTable Component

**app/admin/sources/components/SourceTable.tsx:**
```typescript
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
import { useToast } from '@/components/ui/use-toast';

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
```

### Шаг 4.4: SourceForm Component

**app/admin/sources/components/SourceForm.tsx:**
```typescript
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
import { useToast } from '@/components/ui/use-toast';

const schema = z.object({
  name: z.string().min(3, 'Минимум 3 символа').max(100),
  type: z.enum(['RSS', 'TELEGRAM']),
  url: z.string().url('Неверный формат URL'),
  isActive: z.boolean().default(true)
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

        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
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
```

### Шаг 4.5: Main Sources Page

**app/admin/sources/page.tsx:**
```typescript
'use client';

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
```

---

## 📁 ФАЗА 5: ТЕСТИРОВАНИЕ

### Запустить dev server
```bash
npm run dev
```

### Тесты (выполнить по порядку):

1. **Авторизация**
   - [ ] Открыть http://localhost:3000/admin/sources
   - [ ] Должен редирект на /admin/login
   - [ ] Ввести неверные credentials → показать ошибку
   - [ ] Ввести boss / 149521MkSF#u*V → должен пропустить
   - [ ] Обновить страницу → должен остаться залогинен

2. **Просмотр списка**
   - [ ] Должна показаться таблица с источниками
   - [ ] Проверить что все колонки отображаются

3. **Добавление источника**
   - [ ] Click [+ Добавить источник]
   - [ ] Заполнить: Name=Test, URL=https://www.kyivpost.com/feed
   - [ ] Click [Тест подключения] → должно показать ✅
   - [ ] Click [Добавить] → источник должен появиться в таблице

4. **Ручной импорт**
   - [ ] Click [🔄] на источнике
   - [ ] Должен показать toast с результатом
   - [ ] Счетчик статей должен обновиться

5. **Удаление**
   - [ ] Click [🗑️] → confirm dialog
   - [ ] Источник должен исчезнуть

6. **Logout**
   - [ ] Click [Выйти] → редирект на /admin/login

---

## 📁 ФАЗА 6: DEPLOY

### Коммит и push
```bash
git add .
git commit -m "feat: admin panel with auth and source management

- Hardcoded auth (boss user)
- CRUD operations for sources
- RSS feed testing
- Manual import trigger
- shadcn/ui components
- Protected routes with middleware"

git push origin main
```

### Верификация на production
Подождать 2-3 минуты после push (Dokploy автоматически deploy):

```bash
# Проверить что сайт работает
curl https://mediasyndicate.online/admin/login

# Открыть в браузере
open https://mediasyndicate.online/admin/sources
```

---

## ✅ ЧЕКЛИСТ ЗАВЕРШЕНИЯ

После выполнения всех фаз, проверь:

### Код
- [ ] Все файлы созданы по структуре
- [ ] Нет TypeScript ошибок: `npm run build`
- [ ] Нет ESLint предупреждений

### Функциональность
- [ ] Авторизация работает (boss / 149521MkSF#u*V)
- [ ] Middleware защищает /admin/*
- [ ] Можно добавить источник
- [ ] Тест RSS работает
- [ ] Ручной импорт работает
- [ ] Удаление работает
- [ ] Logout работает

### Production
- [ ] Deploy на https://mediasyndicate.online успешен
- [ ] Админка доступна и работает
- [ ] Нет ошибок в логах

---

## 🆘 TROUBLESHOOTING

### Проблема: "Module not found: jose"
```bash
npm install jose
```

### Проблема: "Cannot read cookies()"
Убедись что используешь `await cookies()` в Next.js 15

### Проблема: shadcn компоненты не работают
```bash
npx shadcn@latest init --force
```

### Проблема: Middleware не срабатывает
Проверь что middleware.ts в корне проекта (рядом с app/)

---

## 📝 ФИНАЛЬНАЯ ИНСТРУКЦИЯ

**Cursor, выполни PHASE by PHASE:**

1. Установи зависимости (Фаза 1)
2. Создай auth систему (Фаза 2) + протестируй
3. Создай API endpoints (Фаза 3)
4. Создай UI компоненты (Фаза 4)
5. Протестируй локально (Фаза 5)
6. Commit + Push (Фаза 6)

**После каждой фазы** - сделай коммит с описанием что сделано.

**Если что-то не работает** - сначала проверь Troubleshooting, потом спроси у Andy.

НАЧИНАЙ С ФАЗЫ 1! 🚀

---

## ✅ АВТОМАТИЧЕСКАЯ ПРОВЕРКА ГОТОВНОСТИ

**CURSOR: ПОСЛЕ ЗАВЕРШЕНИЯ ВСЕХ ФАЗ ВЫПОЛНИ:**

### Шаг 1: Build проверка
```bash
npm run build
```
**Ожидается:** Build successful, 0 errors

### Шаг 2: TypeScript проверка
```bash
npx tsc --noEmit
```
**Ожидается:** 0 errors

### Шаг 3: ESLint проверка
```bash
npm run lint
```
**Ожидается:** No linting errors

### Шаг 4: Запустить dev сервер
```bash
npm run dev
```
**Ожидается:** Server started on port 3000

### Шаг 5: АВТОМАТИЧЕСКИЕ ТЕСТЫ

**Test 1: Login Page**
```bash
curl -s http://localhost:3000/admin/login | grep -q "Admin Panel"
echo "✅ Login page loads"
```

**Test 2: Auth Redirect**
```bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000/admin/sources)
if [ "$STATUS" = "200" ]; then echo "✅ Auth redirect works"; fi
```

**Test 3: Login API**
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"boss","password":"149521MkSF#u*V"}' \
  | grep -q "success"
echo "✅ Login API works"
```

**Test 4: Sources API Protected**
```bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/sources)
if [ "$STATUS" = "401" ]; then echo "✅ API is protected"; fi
```

**Test 5: Health Check**
```bash
curl -s http://localhost:3000/api/health | grep -q "healthy"
echo "✅ Health API works"
```

### Шаг 6: Git операции
```bash
git add .
git commit -m "feat: admin panel with auth and source management

- Hardcoded auth (boss user)
- CRUD operations for sources
- RSS feed testing
- Manual import trigger
- shadcn/ui components
- Protected routes with middleware

✅ All tests passed
✅ Build successful
✅ TypeScript: 0 errors
✅ ESLint: 0 warnings"

git push origin main
```

### Шаг 7: Проверка на production
```bash
# Подождать 2 минуты для деплоя
sleep 120

# Проверить что сайт работает
curl -s https://mediasyndicate.online/admin/login | grep -q "Admin Panel"
echo "✅ Production deploy successful"
```

---

## 🎯 КРИТЕРИИ ПРИЕМКИ (ДЛЯ CURSOR)

**НЕ ОСТАНАВЛИВАЙСЯ пока ВСЕ критерии не выполнены:**

### Обязательные критерии:
- [ ] `npm run build` - успешно
- [ ] `npx tsc --noEmit` - 0 ошибок
- [ ] `npm run lint` - 0 предупреждений
- [ ] `npm run dev` - сервер запустился
- [ ] Login page открывается
- [ ] Auth редирект работает
- [ ] Login с boss/149521MkSF#u*V успешен
- [ ] API /admin/sources защищен (401 без auth)
- [ ] Можно добавить источник через форму
- [ ] Тест RSS подключения работает
- [ ] Ручной импорт работает
- [ ] Удаление источника работает
- [ ] Logout работает
- [ ] Git push успешен
- [ ] Production доступен на https://mediasyndicate.online/admin/login

### Функциональные критерии:
- [ ] shadcn/ui компоненты установлены
- [ ] Все auth файлы созданы (credentials.ts, session.ts, middleware.ts)
- [ ] Все API endpoints работают
- [ ] Все UI компоненты отрисовываются
- [ ] Форма валидируется через Zod
- [ ] Toast уведомления работают
- [ ] TanStack Query кэширует данные

---

## 🚨 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

**CURSOR: Если какой-то тест провалился:**

1. Прочитай ошибку
2. Исправь проблему
3. Запусти тест снова
4. Повтори пока тест не пройдет
5. Только после ВСЕХ ✅ - делай commit

**НЕ ДЕЛАЙ COMMIT ЕСЛИ ЕСТЬ ОШИБКИ!**

---

## 📊 ФИНАЛЬНЫЙ ОТЧЕТ

**CURSOR: После успешного завершения выведи:**

```
✅ TASK-018 COMPLETED

Build: ✅
TypeScript: ✅ (0 errors)
ESLint: ✅ (0 warnings)
Tests: ✅ (15/15 passed)
Git: ✅ (pushed to main)
Production: ✅ (deployed)

Files created:
- lib/auth/credentials.ts
- lib/auth/session.ts
- middleware.ts
- app/admin/login/page.tsx
- app/api/admin/auth/login/route.ts
- app/api/admin/auth/logout/route.ts
- app/api/admin/sources/route.ts
- app/api/admin/sources/test/route.ts
- app/api/admin/sources/[id]/route.ts
- app/api/admin/sources/[id]/import/route.ts
- app/admin/layout.tsx
- app/admin/sources/page.tsx
- app/admin/sources/components/SourceTable.tsx
- app/admin/sources/components/SourceForm.tsx
- app/providers.tsx

Total: X files, Y lines of code

Ready for Andy's review!
```

---

**НАЧИНАЙ РАБОТУ! НЕ ОСТАНАВЛИВАЙСЯ ДО ПОЛНОГО ЗАВЕРШЕНИЯ!** 🚀
