import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import RankingPage from '@/pages/RankingPage';
import ChannelsPage from '@/pages/ChannelsPage';
import ChannelDetailPage from '@/pages/ChannelDetailPage';
import AboutPage from '@/pages/AboutPage';
import AdminPage from '@/pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<RankingPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/channels/:id" element={<ChannelDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
