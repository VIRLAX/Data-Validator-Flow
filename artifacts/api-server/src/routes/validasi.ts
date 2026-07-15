import { Router } from "express";
import { db, stokHarianTable, penjualanTable, cashTable, transferTable, pengeluaranTable, barangTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /validasi/stok
router.get("/stok", async (req, res) => {
  try {
    const { tanggal } = req.query as Record<string, string>;
    const today = tanggal ?? new Date().toISOString().split("T")[0];

    // Cari opname terakhir untuk tanggal ini
    const opname = await db.select().from(stokHarianTable)
      .where(eq(stokHarianTable.tanggal, today));

    const allBarang = await db.select().from(barangTable).where(eq(barangTable.aktif, true));

    let items: any[];
    if (opname.length > 0) {
      items = opname[0].items as any[];
    } else {
      // Jika belum ada opname, tampilkan semua barang dengan stok fisik = stok sistem
      items = allBarang.map(b => ({
        barangId: b.id,
        barangNama: b.nama,
        barangSatuan: b.satuan,
        stokFisik: Number(b.stok),
        stokSistem: Number(b.stok),
        selisih: 0,
        status: "VALID",
      }));
    }

    const totalValid = items.filter((i: any) => i.selisih === 0).length;
    const totalSelisih = items.filter((i: any) => i.selisih !== 0).length;
    const statusKeseluruhan = totalSelisih === 0 ? "VALID" : "TIDAK_VALID";

    const result = items.map((i: any) => ({
      barangId: i.barangId,
      barangNama: i.barangNama,
      barangSatuan: i.barangSatuan ?? "",
      stokSistem: Number(i.stokSistem),
      stokFisik: Number(i.stokFisik),
      selisih: Number(i.selisih),
      persentaseSelisih: i.stokSistem > 0 ? Math.abs(i.selisih / i.stokSistem) * 100 : 0,
      status: i.status,
    }));

    res.json({
      tanggal: today,
      statusKeseluruhan,
      totalBarang: items.length,
      totalValid,
      totalSelisih,
      items: result,
    });
  } catch (err) {
    req.log.error({ err }, "getValidasiStok error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /validasi/keuangan
router.get("/keuangan", async (req, res) => {
  try {
    const { tanggal } = req.query as Record<string, string>;
    const today = tanggal ?? new Date().toISOString().split("T")[0];

    const penjualans = await db.select().from(penjualanTable);
    const pengeluarans = await db.select().from(pengeluaranTable);
    const cashes = await db.select().from(cashTable);
    const transfers = await db.select().from(transferTable);

    const todayPenjualan = penjualans.filter(r => r.tanggal === today);
    const todayPengeluaran = pengeluarans.filter(r => r.tanggal === today);
    const todayCash = cashes.filter(r => r.tanggal === today);
    const todayTransfer = transfers.filter(r => r.tanggal === today);

    const totalPenjualan = todayPenjualan.reduce((s, r) => s + Number(r.totalHarga), 0);
    const totalPengeluaran = todayPengeluaran.reduce((s, r) => s + Number(r.nominal), 0);

    const cashHarian = todayCash.filter(r => r.jenis === "KasHarian");
    const uangSetor = todayCash.filter(r => r.jenis === "UangSetor");
    const uangSisa = todayCash.filter(r => r.jenis === "UangSisa");
    const qris = todayTransfer.filter(r => r.jenis === "QRIS");
    const transferBank = todayTransfer.filter(r => r.jenis === "TransferBank");
    const ewallet = todayTransfer.filter(r => r.jenis === "EWallet");

    const totalCash = cashHarian.reduce((s, r) => s + Number(r.total), 0);
    const totalQRIS = qris.reduce((s, r) => s + Number(r.nominal), 0);
    const totalTransfer = [...transferBank, ...ewallet].reduce((s, r) => s + Number(r.nominal), 0);
    const totalSetor = uangSetor.reduce((s, r) => s + Number(r.total), 0);
    const totalSisa = uangSisa.reduce((s, r) => s + Number(r.total), 0);

    const totalUangMasuk = totalCash + totalQRIS + totalTransfer;
    const selisih = totalPenjualan - totalUangMasuk;
    const statusKeseluruhan = Math.abs(selisih) < 1 ? "VALID" : "TIDAK_VALID";

    const detail = [
      { kategori: "Penjualan", nilaiSistem: totalPenjualan, nilaiFisik: totalUangMasuk, selisih, status: statusKeseluruhan },
      { kategori: "Cash", nilaiSistem: totalCash, nilaiFisik: totalCash, selisih: 0, status: "VALID" },
      { kategori: "QRIS", nilaiSistem: totalQRIS, nilaiFisik: totalQRIS, selisih: 0, status: "VALID" },
      { kategori: "Transfer", nilaiSistem: totalTransfer, nilaiFisik: totalTransfer, selisih: 0, status: "VALID" },
      { kategori: "Pengeluaran", nilaiSistem: totalPengeluaran, nilaiFisik: totalPengeluaran, selisih: 0, status: "VALID" },
      { kategori: "Setor", nilaiSistem: totalSetor, nilaiFisik: totalSetor, selisih: 0, status: "VALID" },
      { kategori: "Sisa", nilaiSistem: totalSisa, nilaiFisik: totalSisa, selisih: 0, status: "VALID" },
    ];

    res.json({
      tanggal: today,
      statusKeseluruhan,
      totalPenjualan,
      totalCash,
      totalTransfer,
      totalQRIS,
      totalPengeluaran,
      totalSetor,
      totalSisa,
      selisih,
      detail,
    });
  } catch (err) {
    req.log.error({ err }, "getValidasiKeuangan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
