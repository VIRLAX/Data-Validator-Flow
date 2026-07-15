import { useState } from "react";
import { 
  useGetTransferList, 
  useCreateTransfer,
  getGetTransferListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowRightLeft, Smartphone } from "lucide-react";

export default function Transfer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: riwayat, isLoading } = useGetTransferList();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Transfer & QRIS</h1>
          <p className="text-muted-foreground mt-1">Catat mutasi uang non-tunai di luar penjualan sistem.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4" /> Catat Mutasi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Catat Transfer / QRIS</DialogTitle>
            </DialogHeader>
            <TransferForm onSuccess={() => {
              setIsModalOpen(false);
              queryClient.invalidateQueries({ queryKey: getGetTransferListQueryKey() });
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-lg">Riwayat Non-Tunai</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium rounded-tl-lg">Tanggal</th>
                <th className="py-3 px-4 font-medium">Jenis Mutasi</th>
                <th className="py-3 px-4 font-medium">Keterangan</th>
                <th className="py-3 px-4 font-medium text-right rounded-tr-lg">Nominal Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : riwayat?.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada data mutasi.</td></tr>
              ) : (
                riwayat?.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">{formatDate(t.tanggal)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                        t.jenis === 'QRIS' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {t.jenis === 'QRIS' ? <Smartphone className="w-3 h-3" /> : <ArrowRightLeft className="w-3 h-3" />}
                        {t.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/80">{t.keterangan || "-"}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-600">+{formatCurrency(t.nominal)}</td>
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

function TransferForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: "QRIS",
    nominal: "",
    keterangan: ""
  });

  const createMut = useCreateTransfer();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ 
      data: {
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        nominal: Number(formData.nominal),
        keterangan: formData.keterangan
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Mutasi dicatat." });
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
        <label className="text-sm font-medium">Jenis</label>
        <Select required value={formData.jenis} onValueChange={v => setFormData({...formData, jenis: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="QRIS">QRIS</SelectItem>
            <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
            <SelectItem value="E-Wallet">E-Wallet (Dana/OVO/GoPay)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nominal (Rp)</label>
        <Input type="number" required min="1" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value})} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Keterangan / Pengirim</label>
        <Input value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} placeholder="Misal: QRIS a.n Budi" />
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createMut.isPending}>
          {createMut.isPending ? "Menyimpan..." : "Simpan Mutasi"}
        </Button>
      </div>
    </form>
  );
}
