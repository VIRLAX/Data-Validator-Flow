import { useState } from "react";
import { 
  useGetLaporanHarian, 
  useGetLaporanMingguan, 
  useGetLaporanBulanan, 
  useGetLaporanTahunan 
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Download, Calendar, TrendingUp, Wallet, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Laporan() {
  const [tab, setTab] = useState("harian");
  const today = new Date().toISOString().split('T')[0];
  
  // Harian params
  const [dateHarian, setDateHarian] = useState(today);
  
  // Mingguan params
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const [dateFrom, setDateFrom] = useState(lastWeek.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today);

  // Bulanan params
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [bulan, setBulan] = useState(currentMonth.toString());
  const [tahunBulanan, setTahunBulanan] = useState(currentYear.toString());

  // Tahunan params
  const [tahunTahunan, setTahunTahunan] = useState(currentYear.toString());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Laporan Bisnis</h1>
          <p className="text-muted-foreground mt-1">Analisis performa penjualan, laba, dan tren.</p>
        </div>
        <Button variant="outline" className="gap-2 shadow-sm">
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
          <TabsTrigger value="harian">Harian</TabsTrigger>
          <TabsTrigger value="mingguan">Mingguan</TabsTrigger>
          <TabsTrigger value="bulanan">Bulanan</TabsTrigger>
          <TabsTrigger value="tahunan">Tahunan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="harian" className="mt-6 space-y-6">
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border w-fit shadow-sm">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input type="date" value={dateHarian} onChange={e => setDateHarian(e.target.value)} className="w-40 border-none shadow-none focus-visible:ring-0 p-0 h-auto font-semibold" />
          </div>
          <LaporanHarianView tanggal={dateHarian} />
        </TabsContent>

        <TabsContent value="mingguan" className="mt-6 space-y-6">
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border w-fit shadow-sm">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 border-none shadow-none focus-visible:ring-0 p-0 h-auto font-semibold text-center" />
            <span className="text-muted-foreground font-medium">-</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 border-none shadow-none focus-visible:ring-0 p-0 h-auto font-semibold text-center" />
          </div>
          <LaporanPeriodeView type="mingguan" dari={dateFrom} sampai={dateTo} />
        </TabsContent>

        <TabsContent value="bulanan" className="mt-6 space-y-6">
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border w-fit shadow-sm">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <select value={bulan} onChange={e => setBulan(e.target.value)} className="bg-transparent border-none font-semibold focus:outline-none cursor-pointer">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
            <select value={tahunBulanan} onChange={e => setTahunBulanan(e.target.value)} className="bg-transparent border-none font-semibold focus:outline-none cursor-pointer">
              {[currentYear-2, currentYear-1, currentYear, currentYear+1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <LaporanBulananView bulan={parseInt(bulan)} tahun={parseInt(tahunBulanan)} />
        </TabsContent>

        <TabsContent value="tahunan" className="mt-6 space-y-6">
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border w-fit shadow-sm">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Tahun:</span>
            <select value={tahunTahunan} onChange={e => setTahunTahunan(e.target.value)} className="bg-transparent border-none font-semibold focus:outline-none cursor-pointer text-lg">
              {[currentYear-2, currentYear-1, currentYear, currentYear+1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <LaporanTahunanView tahun={parseInt(tahunTahunan)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for each tab
function LaporanHarianView({ tanggal }: { tanggal: string }) {
  const { data, isLoading } = useGetLaporanHarian({ tanggal }, { query: { enabled: !!tanggal } });

  if (isLoading) return <div className="h-40 animate-pulse bg-muted/30 rounded-xl"></div>;
  if (!data) return <div className="text-center py-10">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Omzet" value={data.omzet} icon={TrendingUp} color="text-blue-600" />
        <MetricCard label="Laba Kotor" value={data.labaKotor} icon={Wallet} color="text-emerald-600" />
        <MetricCard label="Pengeluaran" value={data.totalPengeluaran} icon={Wallet} color="text-rose-600" />
        <MetricCard label="Total Transaksi" value={data.totalTransaksi} isNumber icon={ShoppingCart} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-4">Top Barang Terjual</h3>
          <div className="space-y-3">
            {data.topBarang?.map((b, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{i+1}</div>
                  <span className="font-medium">{b.barangNama}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{b.jumlahTerjual} qty</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(b.omzet)}</div>
                </div>
              </div>
            ))}
            {!data.topBarang?.length && <p className="text-muted-foreground text-center py-4">Belum ada penjualan</p>}
          </div>
        </div>

        <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm flex flex-col">
          <h3 className="font-bold text-lg mb-4">Distribusi Pengeluaran</h3>
          <div className="h-[250px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.detailPengeluaran || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="kategori"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(data.detailPengeluaran || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            {!data.detailPengeluaran?.length && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">Tidak ada pengeluaran</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LaporanPeriodeView({ type, dari, sampai }: { type: string, dari: string, sampai: string }) {
  const { data, isLoading } = useGetLaporanMingguan({ tanggalDari: dari, tanggalSampai: sampai }, { query: { enabled: !!dari && !!sampai } });

  if (isLoading) return <div className="h-40 animate-pulse bg-muted/30 rounded-xl"></div>;
  if (!data) return <div className="text-center py-10">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Omzet" value={data.omzetTotal} icon={TrendingUp} color="text-blue-600" />
        <MetricCard label="Total Laba" value={data.labaKotorTotal} icon={Wallet} color="text-emerald-600" />
        <MetricCard label="Pengeluaran" value={data.totalPengeluaran} icon={Wallet} color="text-rose-600" />
        <MetricCard label="Transaksi" value={data.totalTransaksi} isNumber icon={ShoppingCart} color="text-purple-600" />
      </div>

      <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-lg mb-6">Tren Harian</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dataHarian}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={v => `Rp ${v/1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px' }} />
              <Line type="monotone" dataKey="omzet" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="pengeluaran" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LaporanBulananView({ bulan, tahun }: { bulan: number, tahun: number }) {
  const { data, isLoading } = useGetLaporanBulanan({ bulan, tahun }, { query: { enabled: !!bulan && !!tahun } });
  
  if (isLoading) return <div className="h-40 animate-pulse bg-muted/30 rounded-xl"></div>;
  if (!data) return <div className="text-center py-10">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Omzet" value={data.omzetTotal} icon={TrendingUp} color="text-blue-600" />
        <MetricCard label="Total Laba" value={data.labaKotorTotal} icon={Wallet} color="text-emerald-600" />
        <MetricCard label="Pengeluaran" value={data.totalPengeluaran} icon={Wallet} color="text-rose-600" />
        <MetricCard label="Transaksi" value={data.totalTransaksi} isNumber icon={ShoppingCart} color="text-purple-600" />
      </div>

      <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-lg mb-6">Tren Harian dalam Sebulan</h3>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dataHarian}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={v => `Rp ${v/1000}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="omzet" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LaporanTahunanView({ tahun }: { tahun: number }) {
  const { data, isLoading } = useGetLaporanTahunan({ tahun }, { query: { enabled: !!tahun } });
  
  if (isLoading) return <div className="h-40 animate-pulse bg-muted/30 rounded-xl"></div>;
  if (!data) return <div className="text-center py-10">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-medium opacity-90">Rekapitulasi Tahun {data.tahun}</h2>
          <div className="text-4xl font-black tracking-tight mt-1">{formatCurrency(data.omzetTotal)}</div>
          <p className="opacity-80 mt-1">Total Omzet Keseluruhan</p>
        </div>
        <div className="flex gap-8 bg-black/10 p-4 rounded-xl border border-white/10">
          <div>
            <div className="text-sm opacity-80 mb-1">Total Laba Bersih</div>
            <div className="text-xl font-bold text-emerald-400">{formatCurrency(data.labaKotorTotal)}</div>
          </div>
          <div>
            <div className="text-sm opacity-80 mb-1">Total Pengeluaran</div>
            <div className="text-xl font-bold text-rose-400">{formatCurrency(data.totalPengeluaran)}</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
        <h3 className="font-bold text-lg mb-6">Tren Bulanan Sepanjang Tahun</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dataBulanan}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={v => `Rp ${v/1000000}M`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="omzet" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, isNumber = false }: any) {
  return (
    <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-foreground truncate">
        {isNumber ? value : formatCurrency(value || 0)}
      </h3>
    </div>
  );
}
