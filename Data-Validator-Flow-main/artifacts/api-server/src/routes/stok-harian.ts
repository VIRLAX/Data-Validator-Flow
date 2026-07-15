import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, stokHarianTable, barangTable } from "@workspace/db";

const router = Router();

function fmt(r: typeof stokHarianTable.$inferSelect) {
  return {
    id: r.id,
    tanggal: r.tanggal,
    items: r.items as any[],
    status: r.status,
    catatan: r.catatan,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /stok-harian
router.get("/", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai } = req.query as Record<string, string>;
    let rows = await db.select().from(stokHarianTable).orderBy(stokHarianTable.tanggal);
    if (tanggalDari) rows = rows.filter(r => r.tanggal >= tanggalDari);
    if (tanggalSampai) rows = rows.filter(r => r.tanggal <= tanggalSampai);
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "getStokHarianList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /stok-harian
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const inputItems: { barangId: number; stokFisik: number }[] = body.items;

    const enrichedItems = [];
    let adaSelisih = false;

    for (const item of inputItems) {
      const [barang] = await db.select().from(barangTable).where(eq(barangTable.id, item.barangId));
      if (!barang) continue;
      const stokSistem = Number(barang.stok);
      const stokFisik = Number(item.stokFisik);
      const selisih = stokFisik - stokSistem;
      const status = selisih === 0 ? "VALID" : selisih > 0 ? "LEBIH" : "KURANG";
      if (selisih !== 0) adaSelisih = true;
      enrichedItems.push({
        barangId: item.barangId,
        barangNama: barang.nama,
        barangSatuan: barang.satuan,
        stokFisik,
        stokSistem,
        selisih,
        status,
      });
    }

    const statusKeseluruhan = adaSelisih ? "TIDAK_VALID" : "VALID";
    const [row] = await db.insert(stokHarianTable).values({
      tanggal: body.tanggal,
      items: JSON.stringify(enrichedItems),
      status: statusKeseluruhan,
      catatan: body.catatan ?? null,
    }).returning();

    res.status(201).json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "createStokHarian error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stok-harian/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(stokHarianTable).where(eq(stokHarianTable.id, id));
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "getStokHarian error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
