import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from './components/layout';
import { AuthProvider, useAuth } from './contexts/auth';
import { CalculatorWidget } from './components/calculator';

import Dashboard from './pages/dashboard';
import Barang from './pages/barang';
import BarangMasuk from './pages/barang-masuk';
import Penjualan from './pages/penjualan';
import Pengeluaran from './pages/pengeluaran';
import Transfer from './pages/transfer';
import Kas from './pages/kas';
import StokHarian from './pages/stok-harian';
import Validasi from './pages/validasi';
import Laporan from './pages/laporan';
import Login from './pages/login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(179,92%,10%)] via-[hsl(179,80%,15%)] to-[hsl(179,70%,22%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/barang" component={Barang} />
        <Route path="/barang-masuk" component={BarangMasuk} />
        <Route path="/penjualan" component={Penjualan} />
        <Route path="/pengeluaran" component={Pengeluaran} />
        <Route path="/transfer" component={Transfer} />
        <Route path="/kas" component={Kas} />
        <Route path="/stok-harian" component={StokHarian} />
        <Route path="/validasi" component={Validasi} />
        <Route path="/laporan" component={Laporan} />
        <Route component={NotFound} />
      </Switch>
      <CalculatorWidget />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppRoutes />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
