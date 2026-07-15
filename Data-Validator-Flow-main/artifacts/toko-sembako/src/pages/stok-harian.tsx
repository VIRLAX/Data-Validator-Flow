import { useState } from "react";
import { 
  useGetStokHarianList, 
  useCreateStokHarian,
  useGetBarangList,
  getGetStokHarianListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ClipboardCheck, Search, Info } from "lucide-react";

export default function StokHarian() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: riwayat, isLoading } = useGetStokHarianList();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Stok Harian (Opname)</h1>
          <p className="text-muted-foreground mt-1">Input pengecekan stok fisik rak vs sistem.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <ClipboardCheck className="w-4 h-4" /> Mulai Opname Stok
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Opname Stok Harian</DialogTitle>
              <DialogDescription>Masukkan jumlah fisik barang yang ada di rak/gudang.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 mt-2">
              <OpnameForm onSuccess={() => {
                setIsModalOpen(false);
                queryClient.invalidateQueries({ queryKey: getGetStokHarianListQueryKey() });
              }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10">
          <h3 className="font-bold text-lg">Riwayat Opname Stok</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">Tanggal</th>
                <th className="py-3 px-4 font-medium">Status Akurasi</th>
                <th className="py-3 px-4 font-medium">Jml Barang Dicek</th>
                <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : riwayat?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada riwayat opname.</td></tr>
              ) : (
                riwayat?.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{formatDate(s.tanggal)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        s.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.status === 'VALID' ? 'TIDAK ADA SELISIH' : 'ADA SELISIH'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{s.items.length} item</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{s.catatan || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OpnameForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: barangList, isLoading } = useGetBarangList({ aktif: "true" });
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState("");
  const [search, setSearch] = useState("");
  
  // Store physical stock indexed by barangId
  const [fisik, setFisik] = useState<Record<number, string>>({});

  const createMut = useCreateStokHarian();
  const { toast } = useToast();

  if (isLoading) return <div className="p-4 text-center">Memuat daftar barang...</div>;

  const filteredBarang = barangList?.filter(b => 
    b.nama.toLowerCase().includes(search.toLowerCase()) || 
    b.kategori.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpdateFisik = (id: number, val: string) => {
    setFisik(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const items = Object.entries(fisik)
      .filter(([_, val]) => val !== "")
      .map(([id, val]) => ({
        barangId: Number(id),
        stokFisik: parseInt(val, 10) || 0
      }));

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Minimal isi 1 barang untuk diopname" });
      return;
    }

    createMut.mutate({ 
      data: {
        tanggal,
        catatan,
        items
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Opname stok harian dicatat." });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-2 gap-4 shrink-0">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tanggal Cek</label>
          <Input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Cari Barang</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter list..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 shrink-0 border border-blue-100">
        <Info className="w-5 h-5 shrink-0" />
        <p>Kosongkan input fisik jika barang tidak dicek. Hanya barang yang diisi yang akan direkam dalam opname hari ini.</p>
      </div>

      <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="py-2.5 px-3 font-medium w-1/2">Nama Barang</th>
              <th className="py-2.5 px-3 font-medium text-center">Stok Sistem</th>
              <th className="py-2.5 px-3 font-medium w-28 text-center">Stok Fisik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredBarang.map(b => {
              const fisikVal = fisik[b.id];
              const isFilled = fisikVal !== undefined && fisikVal !== "";
              const fisikNum = parseInt(fisikVal || "0", 10);
              const selisih = isFilled ? fisikNum - b.stok : 0;
              
              return (
                <tr key={b.id} className={isFilled ? (selisih === 0 ? "bg-emerald-50/30" : "bg-rose-50/50") : ""}>
                  <td className="py-2 px-3">
                    <div className="font-medium">{b.nama}</div>
                    <div className="text-xs text-muted-foreground">{b.kategori} &bull; {b.satuan}</div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-mono text-muted-foreground">{b.stok}</span>
                  </td>
                  <td className="py-2 px-3">
                    <Input 
                      type="number" 
                      min="0"
                      className={`h-9 text-center font-bold ${
                        isFilled && selisih !== 0 ? 'border-rose-500 text-rose-700 focus-visible:ring-rose-500' : ''
                      }`}
                      placeholder="-" 
                      value={fisik[b.id] || ""} 
                      onChange={e => handleUpdateFisik(b.id, e.target.value)}
                    />
                    {isFilled && selisih !== 0 && (
                      <div className="text-[10px] text-center text-rose-600 font-bold mt-1">
                        Selisih: {selisih > 0 ? `+${selisih}` : selisih}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredBarang.length === 0 && (
              <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Tidak ada barang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 shrink-0">
        <label className="text-sm font-medium">Catatan Tambahan</label>
        <Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Misal: Indomie beda 1 karena tikus" />
      </div>

      <div className="pt-2 flex justify-end shrink-0 border-t border-border">
        <Button type="submit" size="lg" className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700" disabled={createMut.isPending}>
          {createMut.isPending ? "Menyimpan..." : `Simpan Opname (${Object.values(fisik).filter(v => v !== "").length} Item)`}
        </Button>
      </div>
    </form>
  );
}
