import { useState } from "react";
import { 
  useGetBarangMasukList, 
  useCreateBarangMasuk,
  useGetBarangList,
  getGetBarangMasukListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowDownToLine } from "lucide-react";

export default function BarangMasuk() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: riwayat, isLoading } = useGetBarangMasukList();

  const queryClient = useQueryClient();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Barang Masuk</h1>
          <p className="text-muted-foreground mt-1">Catat penerimaan barang dari supplier untuk menambah stok.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4" /> Catat Barang Masuk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Catat Barang Masuk</DialogTitle>
            </DialogHeader>
            <BarangMasukForm onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: getGetBarangMasukListQueryKey() });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
          <ArrowDownToLine className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-lg">Riwayat Barang Masuk</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">Tanggal</th>
                <th className="py-3 px-4 font-medium">Supplier</th>
                <th className="py-3 px-4 font-medium">Nama Barang</th>
                <th className="py-3 px-4 font-medium text-right">Jumlah</th>
                <th className="py-3 px-4 font-medium text-right">Harga Satuan</th>
                <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : riwayat?.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Belum ada riwayat barang masuk.</td></tr>
              ) : (
                riwayat?.map((bm) => (
                  <tr key={bm.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{formatDate(bm.tanggal)}</td>
                    <td className="py-3 px-4 font-medium text-foreground/80">{bm.supplier}</td>
                    <td className="py-3 px-4 font-medium">{bm.barangNama}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-xs">
                        +{bm.jumlah} {bm.barangSatuan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{formatCurrency(bm.harga)}</td>
                    <td className="py-3 px-4 text-right font-bold text-primary">{formatCurrency(bm.totalHarga)}</td>
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

function BarangMasukForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: barangList } = useGetBarangList({ aktif: "true" });
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    supplier: "",
    barangId: "",
    jumlah: "",
    harga: "",
    catatan: ""
  });

  const createMut = useCreateBarangMasuk();
  const { toast } = useToast();

  const handleBarangChange = (idStr: string) => {
    const b = barangList?.find(x => x.id.toString() === idStr);
    setFormData({
      ...formData,
      barangId: idStr,
      harga: b ? b.hargaBeli.toString() : ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ 
      data: {
        tanggal: formData.tanggal,
        supplier: formData.supplier,
        barangId: Number(formData.barangId),
        jumlah: Number(formData.jumlah),
        harga: Number(formData.harga),
        catatan: formData.catatan
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Barang masuk berhasil dicatat, stok otomatis bertambah." });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tanggal</label>
          <Input type="date" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier</label>
          <Input required value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} placeholder="Nama supplier/toko" />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Barang</label>
        <Select required value={formData.barangId} onValueChange={handleBarangChange}>
          <SelectTrigger><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
          <SelectContent>
            {barangList?.map(b => (
              <SelectItem key={b.id} value={b.id.toString()}>{b.nama} (Stok: {b.stok} {b.satuan})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Jumlah Masuk</label>
          <Input type="number" required min="1" value={formData.jumlah} onChange={e => setFormData({...formData, jumlah: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Harga Satuan (Beli)</label>
          <Input type="number" required value={formData.harga} onChange={e => setFormData({...formData, harga: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan (Opsional)</label>
        <Input value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} />
      </div>

      <div className="p-4 bg-teal-50 border border-teal-100 rounded-lg flex justify-between items-center mt-2">
        <span className="text-teal-800 font-medium">Total Harga</span>
        <span className="text-teal-900 font-bold text-lg">
          {formatCurrency(Number(formData.jumlah || 0) * Number(formData.harga || 0))}
        </span>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createMut.isPending || !formData.barangId}>
          {createMut.isPending ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </div>
    </form>
  );
}
