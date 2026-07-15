import { useState } from "react";
import { 
  useGetValidasiStok, 
  useGetValidasiKeuangan 
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Validasi() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const { data: vStok, isLoading: loadStok } = useGetValidasiStok({ tanggal });
  const { data: vKeuangan, isLoading: loadUang } = useGetValidasiKeuangan({ tanggal });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Validasi Harian</h1>
          <p className="text-muted-foreground mt-1">Cross-check otomatis antara pencatatan sistem dengan realita.</p>
        </div>
        <div className="bg-card border border-border p-1.5 rounded-lg flex items-center shadow-sm">
          <label className="text-sm font-medium px-3 text-muted-foreground">Pilih Tanggal:</label>
          <Input 
            type="date" 
            value={tanggal} 
            onChange={(e) => setTanggal(e.target.value)} 
            className="w-40 h-9 border-none shadow-none focus-visible:ring-0 font-medium"
          />
        </div>
      </div>

      <Tabs defaultValue="stok" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 p-1">
          <TabsTrigger value="stok" className="text-base data-[state=active]:bg-background data-[state=active]:shadow">
            Validasi Stok Rak
          </TabsTrigger>
          <TabsTrigger value="keuangan" className="text-base data-[state=active]:bg-background data-[state=active]:shadow">
            Validasi Keuangan Kasir
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stok" className="mt-6 space-y-6">
          {loadStok ? (
            <div className="h-40 bg-muted/30 rounded-xl animate-pulse flex items-center justify-center">Memuat...</div>
          ) : !vStok ? (
            <div className="text-center py-12 text-muted-foreground">Data tidak tersedia. Pastikan opname stok harian sudah diisi.</div>
          ) : (
            <>
              {/* Banner Status */}
              <div className={`p-6 rounded-2xl flex items-center gap-4 shadow-sm border ${
                vStok.statusKeseluruhan === 'VALID' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {vStok.statusKeseluruhan === 'VALID' ? (
                  <ShieldCheck className="w-12 h-12 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-rose-600" />
                )}
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {vStok.statusKeseluruhan === 'VALID' ? 'STOK VALID & AKURAT' : 'PERHATIAN: ADA SELISIH STOK'}
                  </h2>
                  <p className="opacity-80 font-medium mt-1">
                    Dari {vStok.totalBarang} barang yang dicek, {vStok.totalSelisih} barang memiliki selisih dengan sistem.
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="py-4 px-5 font-medium">Nama Barang</th>
                      <th className="py-4 px-5 font-medium text-center">Sistem</th>
                      <th className="py-4 px-5 font-medium text-center">Fisik (Opname)</th>
                      <th className="py-4 px-5 font-medium text-center">Selisih</th>
                      <th className="py-4 px-5 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vStok.items.map((item, i) => (
                      <tr key={i} className={item.selisih !== 0 ? 'bg-rose-50/30' : ''}>
                        <td className="py-3 px-5 font-medium">{item.barangNama}</td>
                        <td className="py-3 px-5 text-center font-mono">{item.stokSistem}</td>
                        <td className="py-3 px-5 text-center font-mono font-bold">{item.stokFisik}</td>
                        <td className="py-3 px-5 text-center">
                          {item.selisih === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-rose-100 text-rose-800 font-black font-mono">
                              {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right">
                          {item.status === 'VALID' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle2 className="w-4 h-4"/> OK</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs"><XCircle className="w-4 h-4"/> SELISIH</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {vStok.items.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada data opname di tanggal ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="keuangan" className="mt-6 space-y-6">
          {loadUang ? (
            <div className="h-40 bg-muted/30 rounded-xl animate-pulse flex items-center justify-center">Memuat...</div>
          ) : !vKeuangan ? (
            <div className="text-center py-12 text-muted-foreground">Data tidak tersedia.</div>
          ) : (
            <>
              {/* Banner Status */}
              <div className={`p-6 rounded-2xl flex items-center justify-between shadow-sm border ${
                vKeuangan.statusKeseluruhan === 'VALID' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-4">
                  {vKeuangan.statusKeseluruhan === 'VALID' ? (
                    <ShieldCheck className="w-12 h-12 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-rose-600" />
                  )}
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">
                      {vKeuangan.statusKeseluruhan === 'VALID' ? 'UANG KAS BALANCE' : 'PERHATIAN: KAS TIDAK BALANCE'}
                    </h2>
                    <p className="opacity-80 font-medium mt-1">
                      Perbandingan total uang masuk keluar vs uang fisik (setor + sisa).
                    </p>
                  </div>
                </div>
                {vKeuangan.selisih !== 0 && (
                  <div className="bg-white/50 backdrop-blur px-6 py-3 rounded-xl border border-rose-200 text-right">
                    <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Selisih Uang</div>
                    <div className="text-3xl font-black text-rose-700">{formatCurrency(vKeuangan.selisih)}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-card-border p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
                  <h3 className="font-bold text-lg border-b border-border pb-3">Pencatatan Sistem (Seharusnya)</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Penjualan Cash</span>
                      <span className="font-semibold text-emerald-600">+{formatCurrency(vKeuangan.totalCash)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Transfer Bank</span>
                      <span className="font-semibold text-indigo-600">+{formatCurrency(vKeuangan.totalTransfer)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">QRIS Masuk</span>
                      <span className="font-semibold text-sky-600">+{formatCurrency(vKeuangan.totalQRIS)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-dashed border-border pb-3">
                      <span className="text-muted-foreground">Pengeluaran Harian</span>
                      <span className="font-semibold text-rose-600">-{formatCurrency(vKeuangan.totalPengeluaran)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-foreground">Total Kas Seharusnya</span>
                      <span className="text-xl font-black tracking-tight">{formatCurrency(
                        vKeuangan.totalCash - vKeuangan.totalPengeluaran
                      )}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Hanya menghitung aliran cash fisik (Penjualan Cash - Pengeluaran).</p>
                  </div>
                </div>

                <div className="bg-card border border-card-border p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -z-10"></div>
                  <h3 className="font-bold text-lg border-b border-border pb-3">Fisik Laci Kasir (Kenyataan)</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Uang Disetorkan</span>
                      <span className="font-semibold">{formatCurrency(vKeuangan.totalSetor)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-dashed border-border pb-3">
                      <span className="text-muted-foreground">Uang Sisa (Modal Besok)</span>
                      <span className="font-semibold">{formatCurrency(vKeuangan.totalSisa)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-foreground">Total Laci Dihitung</span>
                      <span className="text-xl font-black tracking-tight text-amber-600">{formatCurrency(
                        vKeuangan.totalSetor + vKeuangan.totalSisa
                      )}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Berdasarkan penghitungan denominasi kas harian.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
