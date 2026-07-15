import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, barangMasukTable, barangTable } from "@workspace/db";

const router = Router();

// GET /barang-masuk
router.get("/", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai } = req.query as Record<string, string>;
    let rows = await db.select({
      bm: barangMasukTable,
      barangNama: barangTable.nama,
      barangSatuan: barangTable.satuan,
    }).from(barangMasukTable)
      .leftJoin(barangTable, eq(barangMasukTable.barangId, barangTable.id))
      .orderBy(barangMasukTable.tanggal);

    if (tanggalDari) rows = rows.filter(r => r.bm.tanggal >= tanggalDari);
    if (tanggalSampai) rows = rows.filter(r => r.bm.tanggal <= tanggalSampai);

    res.json(rows.map(r => ({
      id: r.bm.id,
      tanggal: r.bm.tanggal,
      supplier: r.bm.supplier,
      barangId: r.bm.barangId,
      barangNama: r.barangNama ?? "",
      barangSatuan: r.barangSatuan ?? "",
      jumlah: Number(r.bm.jumlah),
      harga: Number(r.bm.harga),
      totalHarga: Number(r.bm.totalHarga),
      catatan: r.bm.catatan,
      createdAt: r.bm.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "getBarangMasukList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /barang-masuk
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const jumlah = Number(body.jumlah);
    const harga = Number(body.harga);
    const totalHarga = jumlah * harga;

    // update stok barang
    const [barang] = await db.select().from(barangTable).where(eq(barangTable.id, body.barangId));
    if (!barang) { res.status(404).json({ error: "Barang tidak ditemukan" }); return; }

    const stokBaru = Number(barang.stok) + jumlah;
    await db.update(barangTable).set({ stok: String(stokBaru), updatedAt: new Date() }).where(eq(barangTable.id, body.barangId));

    const [row] = await db.insert(barangMasukTable).values({
      tanggal: body.tanggal,
      supplier: body.supplier,
      barangId: body.barangId,
      jumlah: String(jumlah),
      harga: String(harga),
      totalHarga: String(totalHarga),
      catatan: body.catatan ?? null,
    }).returning();

    res.status(201).json({
      id: row.id,
      tanggal: row.tanggal,
      supplier: row.supplier,
      barangId: row.barangId,
      barangNama: barang.nama,
      barangSatuan: barang.satuan,
      jumlah: Number(row.jumlah),
      harga: Number(row.harga),
      totalHarga: Number(row.totalHarga),
      catatan: row.catatan,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createBarangMasuk error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /barang-masuk/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [r] = await db.select({
      bm: barangMasukTable,
      barangNama: barangTable.nama,
      barangSatuan: barangTable.satuan,
    }).from(barangMasukTable)
      .leftJoin(barangTable, eq(barangMasukTable.barangId, barangTable.id))
      .where(eq(barangMasukTable.id, id));
    if (!r) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json({
      id: r.bm.id, tanggal: r.bm.tanggal, supplier: r.bm.supplier, barangId: r.bm.barangId,
      barangNama: r.barangNama ?? "", barangSatuan: r.barangSatuan ?? "",
      jumlah: Number(r.bm.jumlah), harga: Number(r.bm.harga), totalHarga: Number(r.bm.totalHarga),
      catatan: r.bm.catatan, createdAt: r.bm.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "getBarangMasuk error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /barang-masuk/:id (kembalikan stok)
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [bm] = await db.select().from(barangMasukTable).where(eq(barangMasukTable.id, id));
    if (!bm) { res.status(404).json({ error: "Tidak ditemukan" }); return; }

    const [barang] = await db.select().from(barangTable).where(eq(barangTable.id, bm.barangId));
    if (barang) {
      const stokBaru = Math.max(0, Number(barang.stok) - Number(bm.jumlah));
      await db.update(barangTable).set({ stok: String(stokBaru), updatedAt: new Date() }).where(eq(barangTable.id, bm.barangId));
    }

    await db.delete(barangMasukTable).where(eq(barangMasukTable.id, id));
    res.json({ ok: true, message: "Barang masuk dihapus" });
  } catch (err) {
    req.log.error({ err }, "deleteBarangMasuk error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
