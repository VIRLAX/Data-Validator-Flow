import { 
  useGetDashboardSummary, 
  useGetDashboardGrafikTransaksi, 
  useGetDashboardGrafikStok, 
  useGetDashboardTransaksiTerbaru,
  useGetBarangStokRendah
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { 
  Wallet, Banknote, ArrowRightLeft, ShoppingCart, 
  Package, AlertTriangle, ArrowDownToLine, TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: grafikTransaksi, isLoading: loadingGrafik } = useGetDashboardGrafikTransaksi();
  const { data: grafikStok, isLoading: loadingStok } = useGetDashboardGrafikStok();
  const { data: transaksiTerbaru, isLoading: loadingTerbaru } = useGetDashboardTransaksiTerbaru();
  const { data: stokRendah, isLoading: loadingRendah } = useGetBarangStokRendah();

  if (loadingSummary || loadingGrafik || loadingStok || loadingTerbaru || loadingRendah) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Omzet Hari Ini", value: summary?.omzetHariIni, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Laba Kotor", value: summary?.labaKotorHariIni, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Total Cash", value: summary?.totalCash, icon: Banknote, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Transaksi", value: summary?.totalTransaksiHariIni, isNumber: true, icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Transfer Masuk", value: summary?.totalTransfer, icon: ArrowRightLeft, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "QRIS", value: summary?.totalQRIS, icon: ArrowRightLeft, color: "text-sky-600", bg: "bg-sky-100" },
    { label: "Pengeluaran", value: summary?.pengeluaranHariIni, icon: Wallet, color: "text-rose-600", bg: "bg-rose-100" },
    { label: "Barang Masuk", value: summary?.barangMasukHariIni, isNumber: true, icon: ArrowDownToLine, color: "text-teal-600", bg: "bg-teal-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Operasional</h1>
        <p className="text-muted-foreground mt-1">Ringkasan aktivitas harian toko Anda.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-card border border-card-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  {kpi.isNumber ? kpi.value || 0 : formatCurrency(kpi.value || 0)}
                </h3>
              </div>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-card-border p-5 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Grafik Transaksi (30 Hari)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={grafikTransaksi || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  tickFormatter={(value) => `Rp ${value / 1000}k`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  formatter={(value: number, name: string) => [
                    name === 'omzet' || name === 'pengeluaran' ? formatCurrency(value) : value, 
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Line yAxisId="left" type="monotone" dataKey="omzet" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="transaksi" stroke="hsl(var(--secondary))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Stok per Kategori
          </h3>
          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grafikStok || []} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis dataKey="kategori" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                />
                <Bar dataKey="totalStok" radius={[0, 4, 4, 0]}>
                  {(grafikStok || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Transaksi Terbaru
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">Tanggal</th>
                  <th className="pb-3 font-medium">Jenis</th>
                  <th className="pb-3 font-medium">Keterangan</th>
                  <th className="pb-3 font-medium text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transaksiTerbaru?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 whitespace-nowrap">{formatDate(tx.tanggal)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.jenis === 'PENJUALAN' ? 'bg-emerald-100 text-emerald-800' :
                        tx.jenis === 'PENGELUARAN' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.jenis}
                      </span>
                    </td>
                    <td className="py-3 text-foreground/80">{tx.keterangan}</td>
                    <td className="py-3 text-right font-semibold">{formatCurrency(tx.nominal)}</td>
                  </tr>
                ))}
                {!transaksiTerbaru?.length && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada transaksi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Barang Hampir Habis
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-3 font-medium">Nama Barang</th>
                  <th className="pb-3 font-medium">Kategori</th>
                  <th className="pb-3 font-medium text-right">Sisa Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stokRendah?.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-medium">{b.nama}</td>
                    <td className="py-3 text-foreground/80">{b.kategori}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                        {b.stok} {b.satuan}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stokRendah?.length && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">Semua stok aman</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
