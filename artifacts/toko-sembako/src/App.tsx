import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from './components/layout';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
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
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
