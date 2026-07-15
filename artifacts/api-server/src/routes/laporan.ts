import { Router } from "express";
import { db, penjualanTable, pengeluaranTable, barangMasukTable, cashTable, transferTable } from "@workspace/db";

const router = Router();

function sumPenjualan(rows: typeof penjualanTable.$inferSelect[]) {
  return {
    omzet: rows.reduce((s, r) => s + Number(r.totalHarga), 0),
    labaKotor: rows.reduce((s, r) => s + Number(r.labaKotor), 0),
    totalTransaksi: rows.length,
  };
}

function groupByDate(rows: { tanggal: string; totalHarga: string; labaKotor: string }[]) {
  const map = new Map<string, { omzet: number; laba: number; count: number }>();
  for (const r of rows) {
    const prev = map.get(r.tanggal) ?? { omzet: 0, laba: 0, count: 0 };
    map.set(r.tanggal, {
      omzet: prev.omzet + Number(r.totalHarga),
      laba: prev.laba + Number(r.labaKotor),
      count: prev.count + 1,
    });
  }
  return map;
}

// GET /laporan/harian
router.get("/harian", async (req, res) => {
  try {
    const { tanggal } = req.query as Record<string, string>;
    if (!tanggal) { res.status(400).json({ error: "tanggal wajib diisi" }); return; }

    const [penjualans, pengeluarans, barangMasuks, cashes, transfers] = await Promise.all([
      db.select().from(penjualanTable),
      db.select().from(pengeluaranTable),
      db.select().from(barangMasukTable),
      db.select().from(cashTable),
      db.select().from(transferTable),
    ]);

    const dayP = penjualans.filter(r => r.tanggal === tanggal);
    const dayPe = pengeluarans.filter(r => r.tanggal === tanggal);
    const dayBm = barangMasuks.filter(r => r.tanggal === tanggal);
    const dayC = cashes.filter(r => r.tanggal === tanggal);
    const dayT = transfers.filter(r => r.tanggal === tanggal);

    const { omzet, labaKotor, totalTransaksi } = sumPenjualan(dayP);

    // top barang dari items
    const itemMap = new Map<number, { barangId: number; barangNama: string; jumlah: number; omzet: number }>();
    for (const p of dayP) {
      const items = p.items as any[];
      for (const item of items) {
        const prev = itemMap.get(item.barangId) ?? { barangId: item.barangId, barangNama: item.barangNama, jumlah: 0, omzet: 0 };
        itemMap.set(item.barangId, {
          ...prev,
          jumlah: prev.jumlah + Number(item.jumlah),
          omzet: prev.omzet + Number(item.subtotal),
        });
      }
    }
    const topBarang = [...itemMap.values()].sort((a, b) => b.omzet - a.omzet).slice(0, 5).map(b => ({
      barangId: b.barangId, barangNama: b.barangNama, jumlahTerjual: b.jumlah, omzet: b.omzet,
    }));

    const pengeluaranKatMap = new Map<string, number>();
    for (const p of dayPe) {
      pengeluaranKatMap.set(p.kategori, (pengeluaranKatMap.get(p.kategori) ?? 0) + Number(p.nominal));
    }
    const detailPengeluaran = [...pengeluaranKatMap.entries()].map(([kategori, total]) => ({ kategori, total }));

    const cashHarian = dayC.filter(r => r.jenis === "KasHarian").reduce((s, r) => s + Number(r.total), 0);
    const uangSetor = dayC.filter(r => r.jenis === "UangSetor").reduce((s, r) => s + Number(r.total), 0);
    const uangSisa = dayC.filter(r => r.jenis === "UangSisa").reduce((s, r) => s + Number(r.total), 0);
    const totalTransferNominal = dayT.filter(r => r.jenis !== "QRIS").reduce((s, r) => s + Number(r.nominal), 0);
    const totalQRIS = dayT.filter(r => r.jenis === "QRIS").reduce((s, r) => s + Number(r.nominal), 0);

    res.json({
      tanggal,
      omzet,
      labaKotor,
      totalTransaksi,
      totalPengeluaran: dayPe.reduce((s, r) => s + Number(r.nominal), 0),
      totalBarangMasuk: dayBm.reduce((s, r) => s + Number(r.totalHarga), 0),
      totalCash: cashHarian,
      totalTransfer: totalTransferNominal,
      totalQRIS,
      totalSetor: uangSetor,
      totalSisa: uangSisa,
      topBarang,
      detailPengeluaran,
    });
  } catch (err) {
    req.log.error({ err }, "getLaporanHarian error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /laporan/mingguan
router.get("/mingguan", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai } = req.query as Record<string, string>;
    if (!tanggalDari || !tanggalSampai) { res.status(400).json({ error: "tanggalDari dan tanggalSampai wajib" }); return; }

    const [penjualans, pengeluarans] = await Promise.all([
      db.select().from(penjualanTable),
      db.select().from(pengeluaranTable),
    ]);

    const dayP = penjualans.filter(r => r.tanggal >= tanggalDari && r.tanggal <= tanggalSampai);
    const dayPe = pengeluarans.filter(r => r.tanggal >= tanggalDari && r.tanggal <= tanggalSampai);

    const { omzet, labaKotor, totalTransaksi } = sumPenjualan(dayP);

    const dateMap = groupByDate(dayP);
    const dataHarian = [...dateMap.entries()].sort().map(([label, d]) => ({
      label, omzet: d.omzet, transaksi: d.count, pengeluaran: 0,
    }));

    const itemMap = new Map<number, { barangId: number; barangNama: string; jumlah: number; omzet: number }>();
    for (const p of dayP) {
      for (const item of p.items as any[]) {
        const prev = itemMap.get(item.barangId) ?? { barangId: item.barangId, barangNama: item.barangNama, jumlah: 0, omzet: 0 };
        itemMap.set(item.barangId, { ...prev, jumlah: prev.jumlah + Number(item.jumlah), omzet: prev.omzet + Number(item.subtotal) });
      }
    }
    const topBarang = [...itemMap.values()].sort((a, b) => b.omzet - a.omzet).slice(0, 5).map(b => ({
      barangId: b.barangId, barangNama: b.barangNama, jumlahTerjual: b.jumlah, omzet: b.omzet,
    }));

    res.json({
      tanggalDari, tanggalSampai, omzetTotal: omzet, labaKotorTotal: labaKotor,
      totalTransaksi, totalPengeluaran: dayPe.reduce((s, r) => s + Number(r.nominal), 0),
      dataHarian, topBarang,
    });
  } catch (err) {
    req.log.error({ err }, "getLaporanMingguan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /laporan/bulanan
router.get("/bulanan", async (req, res) => {
  try {
    const { tahun, bulan } = req.query as Record<string, string>;
    if (!tahun || !bulan) { res.status(400).json({ error: "tahun dan bulan wajib" }); return; }

    const y = parseInt(tahun);
    const m = parseInt(bulan);
    const pad = String(m).padStart(2, "0");
    const prefix = `${y}-${pad}`;

    const [penjualans, pengeluarans] = await Promise.all([
      db.select().from(penjualanTable),
      db.select().from(pengeluaranTable),
    ]);

    const dayP = penjualans.filter(r => r.tanggal.startsWith(prefix));
    const dayPe = pengeluarans.filter(r => r.tanggal.startsWith(prefix));
    const { omzet, labaKotor, totalTransaksi } = sumPenjualan(dayP);

    const dateMap = groupByDate(dayP);
    const dataHarian = [...dateMap.entries()].sort().map(([label, d]) => ({
      label, omzet: d.omzet, transaksi: d.count, pengeluaran: 0,
    }));

    const itemMap = new Map<number, { barangId: number; barangNama: string; jumlah: number; omzet: number }>();
    for (const p of dayP) {
      for (const item of p.items as any[]) {
        const prev = itemMap.get(item.barangId) ?? { barangId: item.barangId, barangNama: item.barangNama, jumlah: 0, omzet: 0 };
        itemMap.set(item.barangId, { ...prev, jumlah: prev.jumlah + Number(item.jumlah), omzet: prev.omzet + Number(item.subtotal) });
      }
    }
    const topBarang = [...itemMap.values()].sort((a, b) => b.omzet - a.omzet).slice(0, 5).map(b => ({
      barangId: b.barangId, barangNama: b.barangNama, jumlahTerjual: b.jumlah, omzet: b.omzet,
    }));

    const tanggalDari = `${prefix}-01`;
    const tanggalSampai = `${prefix}-${new Date(y, m, 0).getDate()}`;

    res.json({
      tanggalDari, tanggalSampai, omzetTotal: omzet, labaKotorTotal: labaKotor,
      totalTransaksi, totalPengeluaran: dayPe.reduce((s, r) => s + Number(r.nominal), 0),
      dataHarian, topBarang,
    });
  } catch (err) {
    req.log.error({ err }, "getLaporanBulanan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /laporan/tahunan
router.get("/tahunan", async (req, res) => {
  try {
    const { tahun } = req.query as Record<string, string>;
    if (!tahun) { res.status(400).json({ error: "tahun wajib" }); return; }
    const y = parseInt(tahun);
    const prefix = `${y}-`;

    const [penjualans, pengeluarans] = await Promise.all([
      db.select().from(penjualanTable),
      db.select().from(pengeluaranTable),
    ]);

    const dayP = penjualans.filter(r => r.tanggal.startsWith(prefix));
    const dayPe = pengeluarans.filter(r => r.tanggal.startsWith(prefix));
    const { omzet, labaKotor, totalTransaksi } = sumPenjualan(dayP);

    // Group by month
    const monthMap = new Map<string, { omzet: number; count: number }>();
    for (const r of dayP) {
      const label = r.tanggal.substring(0, 7); // YYYY-MM
      const prev = monthMap.get(label) ?? { omzet: 0, count: 0 };
      monthMap.set(label, { omzet: prev.omzet + Number(r.totalHarga), count: prev.count + 1 });
    }
    const dataBulanan = [...monthMap.entries()].sort().map(([label, d]) => ({
      label, omzet: d.omzet, transaksi: d.count, pengeluaran: 0,
    }));

    res.json({
      tahun: y, omzetTotal: omzet, labaKotorTotal: labaKotor,
      totalTransaksi, totalPengeluaran: dayPe.reduce((s, r) => s + Number(r.nominal), 0),
      dataBulanan,
    });
  } catch (err) {
    req.log.error({ err }, "getLaporanTahunan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
