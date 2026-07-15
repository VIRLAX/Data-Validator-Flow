import { useState } from "react";
import { 
  useGetCashList, 
  useCreateCash,
  getGetCashListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Banknote, Calculator } from "lucide-react";

export default function Kas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: riwayat, isLoading } = useGetCashList();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Kas Harian (Laci)</h1>
          <p className="text-muted-foreground mt-1">Hitung dan setorkan uang fisik dari laci kasir.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              <Calculator className="w-4 h-4" /> Hitung Uang Laci
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Kalkulator Denominasi Uang</DialogTitle>
            </DialogHeader>
            <KasForm onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: getGetCashListQueryKey() });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
          <Banknote className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-lg">Riwayat Hitung Kas</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">Tanggal</th>
                <th className="py-3 px-4 font-medium">Jenis Setoran</th>
                <th className="py-3 px-4 font-medium">Catatan</th>
                <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Total Hitungan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : riwayat?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada riwayat hitung kas.</td></tr>
              ) : (
                riwayat?.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{formatDate(c.tanggal)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        c.jenis === 'Uang Setor' ? 'bg-emerald-100 text-emerald-800' :
                        c.jenis === 'Uang Sisa' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {c.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/80">{c.catatan || "-"}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">{formatCurrency(c.total)}</td>
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

const PECAHAN = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

function KasForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: "Uang Setor",
    catatan: ""
  });

  const [lembaran, setLembaran] = useState<Record<number, number>>(
    PECAHAN.reduce((acc, p) => ({ ...acc, [p]: 0 }), {})
  );

  const createMut = useCreateCash();
  const { toast } = useToast();

  const handleUpdateLembar = (pecahan: number, jumlah: string) => {
    const val = parseInt(jumlah, 10);
    setLembaran({
      ...lembaran,
      [pecahan]: isNaN(val) ? 0 : val
    });
  };

  const grandTotal = PECAHAN.reduce((sum, p) => sum + (p * lembaran[p]), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (grandTotal <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Total tidak boleh 0" });
      return;
    }

    const denominasi = PECAHAN.map(p => ({
      pecahan: p,
      jumlahLembar: lembaran[p],
      subtotal: p * lembaran[p]
    })).filter(d => d.jumlahLembar > 0);

    createMut.mutate({ 
      data: {
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        catatan: formData.catatan,
        denominasi
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Data kas fisik tersimpan." });
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
          <label className="text-sm font-medium">Jenis Setoran</label>
          <Select required value={formData.jenis} onValueChange={v => setFormData({...formData, jenis: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Uang Setor">Uang Setor (Diserahkan)</SelectItem>
              <SelectItem value="Uang Sisa">Uang Sisa (Modal Besok)</SelectItem>
              <SelectItem value="Kas Harian">Penghitungan Harian</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto border border-border rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-3 font-medium">Pecahan</th>
              <th className="py-2 px-3 font-medium w-24 text-center">Lembar/Koin</th>
              <th className="py-2 px-3 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {PECAHAN.map(p => {
              const subtotal = p * lembaran[p];
              return (
                <tr key={p}>
                  <td className="py-1.5 px-3 font-medium">{formatCurrency(p)}</td>
                  <td className="py-1.5 px-3">
                    <Input 
                      type="number" 
                      min="0"
                      className="h-8 text-center p-1" 
                      value={lembaran[p] || ""} 
                      onChange={e => handleUpdateLembar(p, e.target.value)}
                    />
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium">
                    {subtotal > 0 ? formatCurrency(subtotal) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-100 border border-amber-200 p-4 rounded-xl flex justify-between items-center text-amber-900 shadow-inner">
        <span className="font-bold text-lg">Total Dihitung:</span>
        <span className="text-2xl font-black">{formatCurrency(grandTotal)}</span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan (Opsional)</label>
        <Input value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} placeholder="Disetorkan ke Bos" />
      </div>

      <div className="pt-2 flex justify-end">
        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" disabled={createMut.isPending}>
          {createMut.isPending ? "Menyimpan..." : "Simpan Penghitungan"}
        </Button>
      </div>
    </form>
  );
}
