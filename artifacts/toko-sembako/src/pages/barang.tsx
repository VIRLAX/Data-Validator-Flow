import { useState } from "react";
import { 
  useGetBarangList, 
  useCreateBarang, 
  useUpdateBarang, 
  useDeleteBarang,
  getGetBarangListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Edit, Trash2, Package } from "lucide-react";

export default function Barang() {
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [aktifFilter, setAktifFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: barangList, isLoading } = useGetBarangList({
    search: search || undefined,
    kategori: kategoriFilter !== "all" ? kategoriFilter : undefined,
    aktif: aktifFilter !== "all" ? aktifFilter : undefined,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createMut = useCreateBarang();
  const updateMut = useUpdateBarang();
  const deleteMut = useDeleteBarang();

  const handleEdit = (id: number) => {
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus barang ini?")) {
      deleteMut.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Barang dihapus" });
          queryClient.invalidateQueries({ queryKey: getGetBarangListQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Master Barang</h1>
          <p className="text-muted-foreground mt-1">Kelola daftar barang, harga, dan stok.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(o) => {
          setIsModalOpen(o);
          if (!o) setEditingId(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Tambah Barang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
            </DialogHeader>
            <BarangForm 
              barangId={editingId} 
              onSuccess={() => {
                setIsModalOpen(false);
                setEditingId(null);
                queryClient.invalidateQueries({ queryKey: getGetBarangListQueryKey() });
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama barang..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Sembako">Sembako</SelectItem>
              <SelectItem value="Minuman">Minuman</SelectItem>
              <SelectItem value="Makanan Ringan">Makanan Ringan</SelectItem>
              <SelectItem value="Bumbu Dapur">Bumbu Dapur</SelectItem>
              <SelectItem value="Keperluan Rumah">Keperluan Rumah</SelectItem>
            </SelectContent>
          </Select>
          <Select value={aktifFilter} onValueChange={setAktifFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Aktif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">Nama Barang</th>
                <th className="py-3 px-4 font-medium">Kategori</th>
                <th className="py-3 px-4 font-medium text-right">Harga Beli</th>
                <th className="py-3 px-4 font-medium text-right">Harga Jual</th>
                <th className="py-3 px-4 font-medium text-right">Stok</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-center rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : barangList?.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Tidak ada barang ditemukan.</td></tr>
              ) : (
                barangList?.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded text-primary">
                        <Package className="w-4 h-4" />
                      </div>
                      {b.nama}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{b.kategori}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(b.hargaBeli)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(b.hargaJual)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${
                        b.stok <= (b.stokMinimum || 0) ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {b.stok} {b.satuan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.aktif ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wider uppercase">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold tracking-wider uppercase">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(b.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
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

// Inner Form component to use React Hook Form easily, or just controlled state
function BarangForm({ barangId, onSuccess }: { barangId: number | null, onSuccess: () => void }) {
  const { data: barang } = useGetBarangList(); // Use list for simple lookup, or detail hook if full. Just using list for speed.
  const existing = barang?.find(b => b.id === barangId);
  
  const [formData, setFormData] = useState({
    nama: existing?.nama || "",
    kategori: existing?.kategori || "Sembako",
    satuan: existing?.satuan || "Pcs",
    hargaBeli: existing?.hargaBeli?.toString() || "",
    hargaJual: existing?.hargaJual?.toString() || "",
    stok: existing?.stok?.toString() || "0",
    stokMinimum: existing?.stokMinimum?.toString() || "0",
    aktif: existing?.aktif !== false,
  });

  const createMut = useCreateBarang();
  const updateMut = useUpdateBarang();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      hargaBeli: Number(formData.hargaBeli),
      hargaJual: Number(formData.hargaJual),
      stok: Number(formData.stok),
      stokMinimum: Number(formData.stokMinimum),
    };

    if (barangId) {
      updateMut.mutate({ id: barangId, data: payload }, {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Barang diperbarui" });
          onSuccess();
        }
      });
    } else {
      createMut.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Berhasil", description: "Barang ditambahkan" });
          onSuccess();
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nama Barang</label>
        <Input required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <Select value={formData.kategori} onValueChange={v => setFormData({...formData, kategori: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Sembako">Sembako</SelectItem>
              <SelectItem value="Minuman">Minuman</SelectItem>
              <SelectItem value="Makanan Ringan">Makanan Ringan</SelectItem>
              <SelectItem value="Bumbu Dapur">Bumbu Dapur</SelectItem>
              <SelectItem value="Keperluan Rumah">Keperluan Rumah</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Satuan</label>
          <Select value={formData.satuan} onValueChange={v => setFormData({...formData, satuan: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Pcs">Pcs</SelectItem>
              <SelectItem value="Dus">Dus</SelectItem>
              <SelectItem value="Karung">Karung</SelectItem>
              <SelectItem value="Ikat">Ikat</SelectItem>
              <SelectItem value="Botol">Botol</SelectItem>
              <SelectItem value="Renceng">Renceng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Harga Beli</label>
          <Input type="number" required value={formData.hargaBeli} onChange={e => setFormData({...formData, hargaBeli: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Harga Jual</label>
          <Input type="number" required value={formData.hargaJual} onChange={e => setFormData({...formData, hargaJual: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Stok Awal</label>
          <Input type="number" required disabled={!!barangId} value={formData.stok} onChange={e => setFormData({...formData, stok: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stok Minimum</label>
          <Input type="number" required value={formData.stokMinimum} onChange={e => setFormData({...formData, stokMinimum: e.target.value})} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" 
          id="aktif" 
          checked={formData.aktif} 
          onChange={e => setFormData({...formData, aktif: e.target.checked})}
          className="rounded border-input text-primary focus:ring-primary h-4 w-4"
        />
        <label htmlFor="aktif" className="text-sm font-medium">Barang Aktif</label>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
          {createMut.isPending || updateMut.isPending ? "Menyimpan..." : "Simpan Barang"}
        </Button>
      </div>
    </form>
  );
}
