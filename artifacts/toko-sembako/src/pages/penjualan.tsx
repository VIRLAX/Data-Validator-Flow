import { useState } from "react";
import { 
  useGetPenjualanList, 
  useCreatePenjualan,
  useGetBarangList,
  getGetPenjualanListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Trash2, Calculator } from "lucide-react";

export default function Penjualan() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: riwayat, isLoading } = useGetPenjualanList();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Penjualan (Kasir)</h1>
          <p className="text-muted-foreground mt-1">Catat transaksi penjualan ke pelanggan.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-6 shadow-md hover:shadow-lg transition-all">
              <ShoppingCart className="w-5 h-5" /> Kasir Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] md:max-w-[900px] h-[90vh] md:h-auto flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl">Transaksi Penjualan</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <PenjualanForm onSuccess={() => {
                setIsModalOpen(false);
                queryClient.invalidateQueries({ queryKey: getGetPenjualanListQueryKey() });
              }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10">
          <h3 className="font-bold text-lg">Riwayat Penjualan</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">No Transaksi</th>
                <th className="py-3 px-4 font-medium">Tanggal</th>
                <th className="py-3 px-4 font-medium">Item</th>
                <th className="py-3 px-4 font-medium">Metode</th>
                <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : riwayat?.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Belum ada riwayat penjualan.</td></tr>
              ) : (
                riwayat?.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground/80">{p.nomorTransaksi}</td>
                    <td className="py-3 px-4">{formatDate(p.tanggal)}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs space-y-1">
                        {p.items.map((i, idx) => (
                          <div key={idx}>{i.jumlah}x {i.barangNama}</div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${
                        p.metodePembayaran === 'CASH' ? 'bg-amber-100 text-amber-800' :
                        p.metodePembayaran === 'QRIS' ? 'bg-sky-100 text-sky-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {p.metodePembayaran}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary text-base">{formatCurrency(p.totalHarga)}</td>
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

function PenjualanForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: barangList } = useGetBarangList({ aktif: "true" });
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [metodePembayaran, setMetodePembayaran] = useState("CASH");
  const [catatan, setCatatan] = useState("");
  
  const [items, setItems] = useState<Array<{
    id: string;
    barangId: string;
    nama: string;
    jumlah: string;
    hargaSatuan: number;
    stokMax: number;
  }>>([]);

  const createMut = useCreatePenjualan();
  const { toast } = useToast();

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), barangId: "", nama: "", jumlah: "1", hargaSatuan: 0, stokMax: 0 }]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'barangId') {
          const b = barangList?.find(x => x.id.toString() === value);
          if (b) {
            updated.nama = b.nama;
            updated.hargaSatuan = b.hargaJual;
            updated.stokMax = b.stok;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalBelanja = items.reduce((sum, item) => sum + (Number(item.jumlah) * item.hargaSatuan), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || items.some(i => !i.barangId || Number(i.jumlah) <= 0)) {
      toast({ variant: "destructive", title: "Error", description: "Pilih barang dan pastikan jumlah > 0" });
      return;
    }

    const payloadItems = items.map(i => ({
      barangId: Number(i.barangId),
      jumlah: Number(i.jumlah),
      hargaSatuan: i.hargaSatuan,
      diskon: 0
    }));

    createMut.mutate({
      data: {
        tanggal,
        metodePembayaran,
        catatan,
        items: payloadItems,
        diskonTotal: 0
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Transaksi penjualan disimpan." });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4 flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tanggal</label>
          <Input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Metode Pembayaran</label>
          <Select value={metodePembayaran} onValueChange={setMetodePembayaran}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash / Tunai</SelectItem>
              <SelectItem value="QRIS">QRIS</SelectItem>
              <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">Daftar Barang</label>
          <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1">
            <Plus className="w-3 h-3" /> Tambah Baris
          </Button>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-border rounded-xl text-muted-foreground flex flex-col items-center">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
            <p>Belum ada barang dipilih.</p>
            <Button type="button" variant="link" onClick={addItem}>Klik untuk tambah</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2 bg-muted/20 p-3 rounded-lg border border-border">
                <div className="w-8 h-10 flex items-center justify-center font-medium text-muted-foreground">{index + 1}.</div>
                <div className="flex-1 space-y-2">
                  <Select value={item.barangId} onValueChange={(v) => updateItem(item.id, 'barangId', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih barang..." /></SelectTrigger>
                    <SelectContent>
                      {barangList?.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()} disabled={b.stok <= 0}>
                          {b.nama} - {formatCurrency(b.hargaJual)} (Stok: {b.stok})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      min="1" 
                      max={item.stokMax}
                      value={item.jumlah} 
                      onChange={e => updateItem(item.id, 'jumlah', e.target.value)} 
                      className="w-24"
                      placeholder="Qty"
                    />
                    <span className="text-sm text-muted-foreground">x {formatCurrency(item.hargaSatuan)}</span>
                    <span className="flex-1 text-right font-bold text-foreground">
                      {formatCurrency(Number(item.jumlah || 0) * item.hargaSatuan)}
                    </span>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-primary p-4 rounded-xl text-primary-foreground shadow-inner mt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 opacity-80" />
            <span className="text-lg font-medium opacity-90">Total Belanja</span>
          </div>
          <span className="text-3xl font-bold tracking-tight">{formatCurrency(totalBelanja)}</span>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" size="lg" className="w-full md:w-auto px-10 text-lg h-12" disabled={createMut.isPending || items.length === 0}>
          {createMut.isPending ? "Memproses..." : "Bayar & Simpan"}
        </Button>
      </div>
    </form>
  );
}
