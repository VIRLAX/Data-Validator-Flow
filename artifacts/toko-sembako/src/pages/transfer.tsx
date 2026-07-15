import { useState, useRef } from "react";
import { 
  useGetTransferList, 
  useCreateTransfer,
  useDeleteTransfer,
  getGetTransferListQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowRightLeft, Smartphone, Camera, Image, X, Trash2, ZoomIn } from "lucide-react";

// ─── Photo upload & OCR-ish parsing helper ─────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Try to extract a rupiah amount from filename or raw text found in a blob URL name */
function guessAmountFromFilename(filename: string): number | null {
  // Match patterns like "20000", "20.000", "20k", "Rp20000", "Rp 20.000"
  const clean = filename.replace(/[_\-]/g, " ").toLowerCase();
  const patterns = [
    /rp\s*([\d.]+)/,
    /(\d{1,3}(?:\.\d{3})+)/, // e.g. 20.000
    /(\d+)k\b/,              // e.g. 20k
    /(\d{4,})/,              // raw digits 4+
  ];
  for (const p of patterns) {
    const m = clean.match(p);
    if (m) {
      let val = m[1].replace(/\./g, "");
      if (p.toString().includes("k")) val = String(parseInt(m[1]) * 1000);
      const n = parseInt(val);
      if (n > 0 && n <= 99_000_000) return n;
    }
  }
  return null;
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function Transfer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  
  const { data: riwayat, isLoading } = useGetTransferList();
  const queryClient = useQueryClient();
  const deleteMut = useDeleteTransfer();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data mutasi ini?")) return;
    deleteMut.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Dihapus", description: "Data mutasi dihapus." });
        queryClient.invalidateQueries({ queryKey: getGetTransferListQueryKey() });
      }
    });
  };

  const totalHari = riwayat?.reduce((s, t) => {
    const today = new Date().toISOString().split("T")[0];
    return t.tanggal === today ? s + Number(t.nominal) : s;
  }, 0) ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
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
          <DialogContent className="sm:max-w-[440px]">
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

      {/* Summary card */}
      {totalHari > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Total Non-Tunai Hari Ini</p>
            <p className="text-xl font-bold text-indigo-700">{formatCurrency(totalHari)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-lg">Riwayat Non-Tunai</h3>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="py-3 px-4 font-medium">Tanggal</th>
                <th className="py-3 px-4 font-medium">Jenis</th>
                <th className="py-3 px-4 font-medium">Keterangan / Pengirim</th>
                <th className="py-3 px-4 font-medium text-center">Bukti</th>
                <th className="py-3 px-4 font-medium text-right">Nominal</th>
                <th className="py-3 px-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Memuat data...</td></tr>
              ) : !riwayat?.length ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ArrowRightLeft className="w-8 h-8 opacity-30" />
                    <p>Belum ada data mutasi.</p>
                  </div>
                </td></tr>
              ) : (
                riwayat.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(t.tanggal)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                        t.jenis === 'QRIS' ? 'bg-sky-100 text-sky-800' :
                        t.jenis === 'E-Wallet' ? 'bg-purple-100 text-purple-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {t.jenis === 'QRIS' ? <Smartphone className="w-3 h-3" /> : <ArrowRightLeft className="w-3 h-3" />}
                        {t.jenis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground/80">{t.keterangan || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {t.buktiFoto ? (
                        <button
                          onClick={() => setPreviewImg(t.buktiFoto!)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                          <ZoomIn className="w-3.5 h-3.5" /> Lihat
                        </button>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-600">
                      +{formatCurrency(t.nominal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image preview modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImg} alt="Bukti Transfer" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

function TransferForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: "QRIS",
    nominal: "",
    keterangan: "",
    buktiFoto: "" as string,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMut = useCreateTransfer();
  const { toast } = useToast();

  const handlePhoto = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      setPhotoPreview(base64);
      setFormData(f => ({ ...f, buktiFoto: base64 }));

      // Try to auto-fill amount from filename
      const guessed = guessAmountFromFilename(file.name);
      if (guessed && !formData.nominal) {
        setFormData(f => ({ ...f, nominal: String(guessed) }));
        toast({ title: "Nominal terdeteksi", description: `Rp ${guessed.toLocaleString("id-ID")} dari nama file.` });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handlePhoto(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nominal || Number(formData.nominal) <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Nominal wajib diisi dan lebih dari 0" });
      return;
    }
    createMut.mutate({ 
      data: {
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        nominal: Number(formData.nominal),
        keterangan: formData.keterangan,
        buktiFoto: formData.buktiFoto || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Berhasil", description: "Mutasi dicatat." });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Tanggal & Jenis side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tanggal</label>
          <Input type="date" required value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Jenis</label>
          <Select value={formData.jenis} onValueChange={v => setFormData({...formData, jenis: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="QRIS">QRIS</SelectItem>
              <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
              <SelectItem value="E-Wallet">E-Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Foto Bukti Transfer */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Foto Bukti Transfer</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-colors overflow-hidden"
        >
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Bukti" className="w-full max-h-48 object-contain bg-muted/30" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); setFormData(f => ({...f, buktiFoto: ""})); }}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-1.5">
                Klik untuk ganti foto
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <div className="flex gap-3">
                    <Camera className="w-6 h-6" />
                    <Image className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium">Ambil foto atau pilih dari galeri</p>
                  <p className="text-xs">JPG, PNG — nominal akan otomatis terdeteksi</p>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Nominal */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nominal (Rp)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
          <Input
            type="number"
            required
            min="1"
            className="pl-9"
            placeholder="0"
            value={formData.nominal}
            onChange={e => setFormData({...formData, nominal: e.target.value})}
          />
        </div>
        {formData.nominal && (
          <p className="text-xs text-muted-foreground pl-1">
            = {Number(formData.nominal).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
          </p>
        )}
      </div>

      {/* Keterangan */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Keterangan / Nama Pengirim</label>
        <Input
          value={formData.keterangan}
          onChange={e => setFormData({...formData, keterangan: e.target.value})}
          placeholder="Misal: QRIS a.n Budi Santoso"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        disabled={createMut.isPending}
      >
        {createMut.isPending ? "Menyimpan..." : "Simpan Mutasi"}
      </Button>
    </form>
  );
}
