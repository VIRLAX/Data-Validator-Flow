import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, cashTable } from "@workspace/db";

const router = Router();

function fmt(r: typeof cashTable.$inferSelect) {
  return {
    id: r.id,
    tanggal: r.tanggal,
    jenis: r.jenis,
    denominasi: r.denominasi as { pecahan: number; jumlahLembar: number; subtotal: number }[],
    total: Number(r.total),
    catatan: r.catatan,
    createdAt: r.createdAt.toISOString(),
  };
}

function hitungTotal(denominasi: { pecahan: number; jumlahLembar: number }[]): number {
  return denominasi.reduce((sum, d) => sum + d.pecahan * d.jumlahLembar, 0);
}

// GET /cash
router.get("/", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai } = req.query as Record<string, string>;
    let rows = await db.select().from(cashTable).orderBy(cashTable.tanggal);
    if (tanggalDari) rows = rows.filter(r => r.tanggal >= tanggalDari);
    if (tanggalSampai) rows = rows.filter(r => r.tanggal <= tanggalSampai);
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "getCashList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /cash
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const denominasi = (body.denominasi as { pecahan: number; jumlahLembar: number }[]).map(d => ({
      pecahan: d.pecahan,
      jumlahLembar: d.jumlahLembar,
      subtotal: d.pecahan * d.jumlahLembar,
    }));
    const total = hitungTotal(denominasi);
    const [row] = await db.insert(cashTable).values({
      tanggal: body.tanggal,
      jenis: body.jenis,
      denominasi: JSON.stringify(denominasi),
      total: String(total),
      catatan: body.catatan ?? null,
    }).returning();
    res.status(201).json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "createCash error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /cash/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(cashTable).where(eq(cashTable.id, id));
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "getCash error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /cash/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const upd: Record<string, unknown> = {};
    if (body.tanggal !== undefined) upd.tanggal = body.tanggal;
    if (body.jenis !== undefined) upd.jenis = body.jenis;
    if (body.catatan !== undefined) upd.catatan = body.catatan;
    if (body.denominasi !== undefined) {
      const denominasi = (body.denominasi as { pecahan: number; jumlahLembar: number }[]).map(d => ({
        pecahan: d.pecahan,
        jumlahLembar: d.jumlahLembar,
        subtotal: d.pecahan * d.jumlahLembar,
      }));
      upd.denominasi = JSON.stringify(denominasi);
      upd.total = String(hitungTotal(denominasi));
    }
    const [row] = await db.update(cashTable).set(upd).where(eq(cashTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "updateCash error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /cash/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(cashTable).where(eq(cashTable.id, id));
    res.json({ ok: true, message: "Kas dihapus" });
  } catch (err) {
    req.log.error({ err }, "deleteCash error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
