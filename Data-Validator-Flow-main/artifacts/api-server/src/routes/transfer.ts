import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, transferTable } from "@workspace/db";

const router = Router();

function fmt(r: typeof transferTable.$inferSelect) {
  return {
    id: r.id,
    tanggal: r.tanggal,
    jenis: r.jenis,
    nominal: Number(r.nominal),
    keterangan: r.keterangan,
    buktiFoto: r.buktiFoto,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /transfer
router.get("/", async (req, res) => {
  try {
    const { tanggalDari, tanggalSampai, jenis } = req.query as Record<string, string>;
    let rows = await db.select().from(transferTable).orderBy(transferTable.tanggal);
    if (tanggalDari) rows = rows.filter(r => r.tanggal >= tanggalDari);
    if (tanggalSampai) rows = rows.filter(r => r.tanggal <= tanggalSampai);
    if (jenis) rows = rows.filter(r => r.jenis === jenis);
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error({ err }, "getTransferList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /transfer
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [row] = await db.insert(transferTable).values({
      tanggal: body.tanggal,
      jenis: body.jenis,
      nominal: String(body.nominal),
      keterangan: body.keterangan ?? null,
      buktiFoto: body.buktiFoto ?? null,
    }).returning();
    res.status(201).json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "createTransfer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transfer/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(transferTable).where(eq(transferTable.id, id));
    if (!row) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
    res.json(fmt(row));
  } catch (err) {
    req.log.error({ err }, "getTransfer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /transfer/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(transferTable).where(eq(transferTable.id, id));
    res.json({ ok: true, message: "Transfer dihapus" });
  } catch (err) {
    req.log.error({ err }, "deleteTransfer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
