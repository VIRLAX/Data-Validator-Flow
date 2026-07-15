import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, penjualanTable, barangTable } from "@workspace/db";

const router = Router();

function formatTransaksi(row: typeof penjualanTable.$inferSelect) {
  return {
    id: row.id,
    tanggal: row.tanggal,
    nomorTransaksi: row.nomorTransaksi,
    items: row.items as any[],
    totalHarga: Number(row.totalHarga),
    diskonTotal: Number(row.diskonTotal),
    labaKotor: Number(row.labaKotor),
    metodePembayaran: row.metodePembayaran,
    catatan: row.catatan,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /penjualan
router.get("/", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai } = req.query as Record<string, string>;
    let rows = await db.select().from(penjualanTable).orderBy(penjualanTable.tanggal);
    if (tanggalDari) rows = rows.filter(r => r.tanggal >= tanggalDari);
    if (tanggalSampai) rows = rows.filter(r => r.tanggal <= tanggalSampai);
    res.json(rows.map(formatTransaksi));
  } catch (err) {
    req.log.error({ err }, "getPenjualanList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /penjualan
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const rawItems: { barangId: number; jumlah: number; hargaSatuan: number; diskon?: number }[] = body.items;

    // enrich items with barang data and update stok
    const enrichedItems = [];
    let totalHarga = 0;
    let labaKotor = 0;
    const diskonTotal = Number(body.diskonTotal ?? 0);

    for (const item of rawItems) {
      const [barang] = await db.select().from(barangTable).where(eq(barangTable.id, item.barangId));
      if (!barang) { res.status(404).json({ error: `Barang id ${item.barangId} tidak ditemukan` }); return; }

      const diskon = Number(item.diskon ?? 0);
      const subtotal = (item.jumlah * item.hargaSatuan) - diskon;
      const hargaBeli = Number(barang.hargaBeli);
      const itemLabaKotor = (item.hargaSatuan - hargaBeli) * item.jumlah - diskon;

      enrichedItems.push({
        barangId: item.barangId,
        barangNama: barang.nama,
        barangSatuan: barang.satuan,
        jumlah: item.jumlah,
        hargaBeli,
        hargaSatuan: item.hargaSatuan,
        diskon,
        subtotal,
        labaKotor: itemLabaKotor,
      });

      totalHarga += subtotal;
      labaKotor += itemLabaKotor;

      // kurangi stok
      const stokBaru = Math.max(0, Number(barang.stok) - item.jumlah);
      await db.update(barangTable).set({ stok: String(stokBaru), updatedAt: new Date() }).where(eq(barangTable.id, item.barangId));
    }

    totalHarga -= diskonTotal;
    labaKotor -= diskonTotal;

    const nomorTransaksi = `TRX-${Date.now()}`;
    const [row] = await db.insert(penjualanTable).values({
      tanggal: body.tanggal,
      nomorTransaksi,
      items: JSON.stringify(enrichedItems),
      totalHarga: String(totalHarga),
      diskonTotal: String(diskonTotal),
      labaKotor: String(labaKotor),
      metodePembayaran: body.metodePembayaran ?? "Cash",
      catatan: body.catatan ?? null,
    }).returning();

    res.status(201).json(formatTransaksi(row));
  } catch (err) {
    req.log.error({ err }, "createPenjualan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /penjualan/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(penjualanTable).where(eq(penjualanTable.id, id));
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(formatTransaksi(row));
  } catch (err) {
    req.log.error({ err }, "getPenjualan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /penjualan/:id (kembalikan stok)
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(penjualanTable).where(eq(penjualanTable.id, id));
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }

    const items = row.items as any[];
    for (const item of items) {
      const [barang] = await db.select().from(barangTable).where(eq(barangTable.id, item.barangId));
      if (barang) {
        const stokBaru = Number(barang.stok) + Number(item.jumlah);
        await db.update(barangTable).set({ stok: String(stokBaru), updatedAt: new Date() }).where(eq(barangTable.id, item.barangId));
      }
    }

    await db.delete(penjualanTable).where(eq(penjualanTable.id, id));
    res.json({ ok: true, message: "Penjualan dihapus" });
  } catch (err) {
    req.log.error({ err }, "deletePenjualan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
