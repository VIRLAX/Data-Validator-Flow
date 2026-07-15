import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, barangTable, penjualanTable, pengeluaranTable, barangMasukTable, cashTable, transferTable } from "@workspace/db";

const router = Router();

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// GET /dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const today = todayStr();

    const [allBarang, penjualans, pengeluarans, barangMasuks, cashes, transfers] = await Promise.all([
      db.select().from(barangTable).where(eq(barangTable.aktif, true)),
      db.select().from(penjualanTable),
      db.select().from(pengeluaranTable),
      db.select().from(barangMasukTable),
      db.select().from(cashTable),
      db.select().from(transferTable),
    ]);

    const dayP = penjualans.filter(r => r.tanggal === today);
    const dayPe = pengeluarans.filter(r => r.tanggal === today);
    const dayBm = barangMasuks.filter(r => r.tanggal === today);
    const dayC = cashes.filter(r => r.tanggal === today);
    const dayT = transfers.filter(r => r.tanggal === today);

    const hampirHabis = allBarang.filter(b => {
      const stok = Number(b.stok);
      const min = b.stokMinimum !== null ? Number(b.stokMinimum) : 5;
      return stok <= min;
    });

    const omzetHariIni = dayP.reduce((s, r) => s + Number(r.totalHarga), 0);
    const labaKotorHariIni = dayP.reduce((s, r) => s + Number(r.labaKotor), 0);
    const totalCash = dayC.filter(r => r.jenis === "KasHarian").reduce((s, r) => s + Number(r.total), 0);
    const uangSetor = dayC.filter(r => r.jenis === "UangSetor").reduce((s, r) => s + Number(r.total), 0);
    const uangSisa = dayC.filter(r => r.jenis === "UangSisa").reduce((s, r) => s + Number(r.total), 0);
    const totalTransfer = dayT.filter(r => r.jenis !== "QRIS").reduce((s, r) => s + Number(r.nominal), 0);
    const totalQRIS = dayT.filter(r => r.jenis === "QRIS").reduce((s, r) => s + Number(r.nominal), 0);

    res.json({
      tanggal: today,
      totalStokBarang: allBarang.length,
      barangHampirHabis: hampirHabis.length,
      barangMasukHariIni: dayBm.reduce((s, r) => s + Number(r.totalHarga), 0),
      pengeluaranHariIni: dayPe.reduce((s, r) => s + Number(r.nominal), 0),
      totalCash,
      totalTransfer,
      totalQRIS,
      uangSetor,
      uangSisa,
      omzetHariIni,
      totalTransaksiHariIni: dayP.length,
      labaKotorHariIni,
    });
  } catch (err) {
    req.log.error({ err }, "getDashboardSummary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/grafik-transaksi (30 hari terakhir)
router.get("/grafik-transaksi", async (req, res) => {
  try {
    const penjualans = await db.select().from(penjualanTable);
    const pengeluarans = await db.select().from(pengeluaranTable);

    const result: { label: string; omzet: number; transaksi: number; pengeluaran: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().split("T")[0];
      const dayP = penjualans.filter(r => r.tanggal === label);
      const dayPe = pengeluarans.filter(r => r.tanggal === label);
      result.push({
        label,
        omzet: dayP.reduce((s, r) => s + Number(r.totalHarga), 0),
        transaksi: dayP.length,
        pengeluaran: dayPe.reduce((s, r) => s + Number(r.nominal), 0),
      });
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "getDashboardGrafikTransaksi error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/grafik-stok
router.get("/grafik-stok", async (req, res) => {
  try {
    const barangs = await db.select().from(barangTable).where(eq(barangTable.aktif, true));
    const kategoriMap = new Map<string, { totalStok: number; jumlahBarang: number }>();
    for (const b of barangs) {
      const prev = kategoriMap.get(b.kategori) ?? { totalStok: 0, jumlahBarang: 0 };
      kategoriMap.set(b.kategori, {
        totalStok: prev.totalStok + Number(b.stok),
        jumlahBarang: prev.jumlahBarang + 1,
      });
    }
    res.json([...kategoriMap.entries()].map(([kategori, d]) => ({ kategori, totalStok: d.totalStok, jumlahBarang: d.jumlahBarang })));
  } catch (err) {
    req.log.error({ err }, "getDashboardGrafikStok error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/transaksi-terbaru
router.get("/transaksi-terbaru", async (req, res) => {
  try {
    const [penjualans, pengeluarans, transfers] = await Promise.all([
      db.select().from(penjualanTable),
      db.select().from(pengeluaranTable),
      db.select().from(transferTable),
    ]);

    const items: { id: number; tanggal: string; jenis: string; keterangan: string; nominal: number; createdAt: string }[] = [];

    for (const r of penjualans) {
      items.push({ id: r.id, tanggal: r.tanggal, jenis: "Penjualan", keterangan: r.nomorTransaksi, nominal: Number(r.totalHarga), createdAt: r.createdAt.toISOString() });
    }
    for (const r of pengeluarans) {
      items.push({ id: r.id, tanggal: r.tanggal, jenis: "Pengeluaran", keterangan: r.kategori, nominal: Number(r.nominal), createdAt: r.createdAt.toISOString() });
    }
    for (const r of transfers) {
      items.push({ id: r.id, tanggal: r.tanggal, jenis: r.jenis, keterangan: r.keterangan ?? r.jenis, nominal: Number(r.nominal), createdAt: r.createdAt.toISOString() });
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json(items.slice(0, 10));
  } catch (err) {
    req.log.error({ err }, "getDashboardTransaksiTerbaru error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
