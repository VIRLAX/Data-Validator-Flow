import { useState } from "react";
import { 
  useGetPengeluaranList, 
  useCreatePengeluaran,
  getGetPengeluaranListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Wallet, Search } from "lucide-react";

export default function Pengeluaran() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kategoriFilter, setKategoriFilter] = useState("all");
  
  const { data: riwayat, isLoading } = useGetPengeluaranList({
    kategori: kategoriFilter !== "all" ? kategoriFilter : undefined
  });

  const queryClient = useQueryClient();

  const totalPengeluaran = riwayat?.reduce((sum, p) => sum + p.nominal, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Pengeluaran Operasional</h1>
          <p className="text-muted-foreground mt-1">Catat biaya operasional toko harian.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="w-4 h-4" /> Catat Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Input Pengeluaran</DialogTitle>
            </DialogHeader>
            <PengeluaranForm onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: getGetPengeluaranListQueryKey() });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-lg">Riwayat Pengeluaran</h3>
          </div>
          <div className="flex items-center gap-4">
            <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
              <SelectTrigger className="w-[180px] h-8 bg-background">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="Kresek">Kresek/Plastik</SelectItem>
                <SelectItem value="Makan">Uang Makan</SelectItem>
                <SelectItem value="Transport">Bensin/Transport</SelectItem>
                <SelectItem value="Listrik">Listrik & Air</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            <div className="bg-rose-100 text-rose-800 px-3 py-1 rounded-lg font-bold text-sm">
              Total: {formatCurrency(totalPengeluaran)}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">Tanggal</th>
                <th className="py-3 px-4 font-medium">Kategori</th>
                <th className="py-3 px-4 font-medium">Catatan</th>
                <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : riwayat?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada data pengeluaran.</td></tr>
              ) : (
                riwayat?.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{formatDate(p.tanggal)}</td>
                    <td className="py-3 px-4">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-medium">{p.kategori}</span>
                    </td>
                    <td className="py-3 px-4 text-foreground/80">{p.catatan || "-"}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(p.nominal)}</td>
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

function PengeluaranForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: "Kresek",
    nominal: "",
    catatan: ""
  });

  const createMut = useCreatePengeluaran();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ 
      data: {
        tanggal: formData.tanggal,
        kategori: formData.kategori,
        nominal: Number(formData.nominal),
        catatan: formData.catatan
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Pengeluaran dicatat." });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Tanggal</label>
        <Input type="date" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Kategori</label>
        <Select required value={formData.kategori} onValueChange={v => setFormData({...formData, kategori: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Kresek">Kresek / Plastik</SelectItem>
            <SelectItem value="Makan">Uang Makan</SelectItem>
            <SelectItem value="Transport">Bensin / Transport</SelectItem>
            <SelectItem value="Listrik">Listrik & Air</SelectItem>
            <SelectItem value="Gaji">Gaji Karyawan</SelectItem>
            <SelectItem value="Lainnya">Lain-lain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nominal (Rp)</label>
        <Input type="number" required min="1" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan / Keterangan</label>
        <Input value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} placeholder="Misal: Plastik ukuran tanggung" />
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={createMut.isPending}>
          {createMut.isPending ? "Menyimpan..." : "Simpan Pengeluaran"}
        </Button>
      </div>
    </form>
  );
}
