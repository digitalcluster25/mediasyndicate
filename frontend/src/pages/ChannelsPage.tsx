import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useChannels, useCategories } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function ChannelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const sort = searchParams.get('sort') || 'total_score';
  const [searchInput, setSearchInput] = useState(search || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryId || '');

  const { data, isLoading } = useChannels({ page, categoryId: selectedCategory || undefined, search, sort } as Record<string, string | number>);
  const { data: categories } = useCategories();

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (searchInput) params.search = searchInput;
    if (selectedCategory) params.category = selectedCategory;
    params.page = '1';
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Каталог каналов</h1>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Поиск каналов..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}><Search className="h-4 w-4" /></Button>
        </div>
        {categories && (
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setSearchParams({ category: e.target.value, page: '1', ...(search ? { search } : {}) }); }}
            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'total_score', label: 'По баллам' },
          { key: 'subscribers', label: 'По подписчикам' },
          { key: 'created_at', label: 'По дате' },
        ].map((opt) => (
          <Button
            key={opt.key}
            variant={sort === opt.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchParams({ sort: opt.key, page: '1', ...(categoryId ? { category: categoryId } : {}) })}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" /> {opt.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data.map((ch) => (
            <Link key={ch.id} to={`/channels/${ch.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{ch.title}</h3>
                  <p className="text-sm text-gray-500">@{ch.username}</p>
                  {ch.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ch.description}</p>}
                  <div className="flex gap-2 mt-3">
                    {ch.category && <Badge variant="secondary">{ch.category.name}</Badge>}
                    {ch.country && <Badge variant="outline">{ch.country}</Badge>}
                  </div>
                  {ch.latestStats && (
                    <div className="flex justify-between mt-3 text-xs text-gray-500">
                      <span>{ch.latestStats.subscribers?.toLocaleString()} подп.</span>
                      <span>ER: {ch.latestStats.engagementScore?.toFixed(1)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">{data.pagination.total} каналов</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setSearchParams({ page: String(page - 1), ...(categoryId ? { category: categoryId } : {}) })}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setSearchParams({ page: String(page + 1), ...(categoryId ? { category: categoryId } : {}) })}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
