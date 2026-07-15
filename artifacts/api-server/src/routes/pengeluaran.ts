import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, pengeluaranTable } from "@workspace/db";

const router = Router();

function fmt(r: typeof pengeluaranTable.$inferSelect) {
  return {
    id: r.id,
    tanggal: r.tanggal,
    kategori: r.kategori,
    nominal: Number(r.nominal),
    catatan: r.catatan,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /pengeluaran
router.get("/", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai, kategori } = req.query as Record<string, string>;
    let rows = await db.select().from(pengeluaranTable).orderBy(pengeluaranTable.tanggal);
    if (tanggalDari) rows = rows.filter(r => r.tanggal >= tanggalDari);
    if (tanggalSampai) rows = rows.filter(r => r.tanggal <= tanggalSampai);
    if (kategori) rows = rows.filter(r => r.kategori === kategori);
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "getPengeluaranList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /pengeluaran
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [row] = await db.insert(pengeluaranTable).values({
      tanggal: body.tanggal,
      kategori: body.kategori,
      nominal: String(body.nominal),
      catatan: body.catatan ?? null,
    }).returning();
    res.status(201).json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "createPengeluaran error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /pengeluaran/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(pengeluaranTable).where(eq(pengeluaranTable.id, id));
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "getPengeluaran error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /pengeluaran/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const upd: Record<string, unknown> = {};
    if (body.tanggal !== undefined) upd.tanggal = body.tanggal;
    if (body.kategori !== undefined) upd.kategori = body.kategori;
    if (body.nominal !== undefined) upd.nominal = String(body.nominal);
    if (body.catatan !== undefined) upd.catatan = body.catatan;
    const [row] = await db.update(pengeluaranTable).set(upd).where(eq(pengeluaranTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "updatePengeluaran error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /pengeluaran/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(pengeluaranTable).where(eq(pengeluaranTable.id, id));
    res.json({ ok: true, message: "Pengeluaran dihapus" });
  } catch (err) {
    req.log.error({ err }, "deletePengeluaran error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
