import { Router } from "express";
import { eq, ilike, and, lte } from "drizzle-orm";
import { db, barangTable } from "@workspace/db";

const router = Router();

// GET /barang
router.get("/", async (req, res) => {
  try {
    const { search, kategori, aktif } = req.query as Record<string, string>;
    let rows = await db.select().from(barangTable).orderBy(barangTable.nama);

    if (search) {
      rows = rows.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()));
    }
    if (kategori) {
      rows = rows.filter(r => r.kategori === kategori);
    }
    if (aktif !== undefined) {
      const isAktif = aktif === "true";
      rows = rows.filter(r => r.aktif === isAktif);
    }

    const result = rows.map(r => ({
      id: r.id,
      nama: r.nama,
      kategori: r.kategori,
      satuan: r.satuan,
      hargaBeli: Number(r.hargaBeli),
      hargaJual: Number(r.hargaJual),
      stok: Number(r.stok),
      stokMinimum: r.stokMinimum !== null ? Number(r.stokMinimum) : null,
      barcode: r.barcode,
      foto: r.foto,
      aktif: r.aktif,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "getBarangList error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /barang/stok-rendah
router.get("/stok-rendah", async (req, res) => {
  try {
    const rows = await db.select().from(barangTable).where(eq(barangTable.aktif, true));
    const hampirHabis = rows.filter(r => {
      const stok = Number(r.stok);
      const min = r.stokMinimum !== null ? Number(r.stokMinimum) : 5;
      return stok <= min;
    });
    res.json(hampirHabis.map(r => ({
      id: r.id,
      nama: r.nama,
      kategori: r.kategori,
      satuan: r.satuan,
      hargaBeli: Number(r.hargaBeli),
      hargaJual: Number(r.hargaJual),
      stok: Number(r.stok),
      stokMinimum: r.stokMinimum !== null ? Number(r.stokMinimum) : null,
      barcode: r.barcode,
      foto: r.foto,
      aktif: r.aktif,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "getBarangStokRendah error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /barang
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const [row] = await db.insert(barangTable).values({
      nama: body.nama,
      kategori: body.kategori ?? "Umum",
      satuan: body.satuan ?? "Pcs",
      hargaBeli: String(body.hargaBeli ?? 0),
      hargaJual: String(body.hargaJual ?? 0),
      stok: String(body.stok ?? 0),
      stokMinimum: body.stokMinimum !== undefined ? String(body.stokMinimum) : null,
      barcode: body.barcode ?? null,
      foto: body.foto ?? null,
      aktif: body.aktif !== undefined ? body.aktif : true,
    }).returning();
    res.status(201).json({
      id: row.id,
      nama: row.nama,
      kategori: row.kategori,
      satuan: row.satuan,
      hargaBeli: Number(row.hargaBeli),
      hargaJual: Number(row.hargaJual),
      stok: Number(row.stok),
      stokMinimum: row.stokMinimum !== null ? Number(row.stokMinimum) : null,
      barcode: row.barcode,
      foto: row.foto,
      aktif: row.aktif,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createBarang error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /barang/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db.select().from(barangTable).where(eq(barangTable.id, id));
    if (!row) { res.status(404).json({ error: "Barang tidak ditemukan" }); return; }
    res.json({
      id: row.id, nama: row.nama, kategori: row.kategori, satuan: row.satuan,
      hargaBeli: Number(row.hargaBeli), hargaJual: Number(row.hargaJual),
      stok: Number(row.stok), stokMinimum: row.stokMinimum !== null ? Number(row.stokMinimum) : null,
      barcode: row.barcode, foto: row.foto, aktif: row.aktif,
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "getBarang error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /barang/:id
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.kategori !== undefined) updateData.kategori = body.kategori;
    if (body.satuan !== undefined) updateData.satuan = body.satuan;
    if (body.hargaBeli !== undefined) updateData.hargaBeli = String(body.hargaBeli);
    if (body.hargaJual !== undefined) updateData.hargaJual = String(body.hargaJual);
    if (body.stok !== undefined) updateData.stok = String(body.stok);
    if (body.stokMinimum !== undefined) updateData.stokMinimum = body.stokMinimum !== null ? String(body.stokMinimum) : null;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.foto !== undefined) updateData.foto = body.foto;
    if (body.aktif !== undefined) updateData.aktif = body.aktif;
    const [row] = await db.update(barangTable).set(updateData).where(eq(barangTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Barang tidak ditemukan" }); return; }
    res.json({
      id: row.id, nama: row.nama, kategori: row.kategori, satuan: row.satuan,
      hargaBeli: Number(row.hargaBeli), hargaJual: Number(row.hargaJual),
      stok: Number(row.stok), stokMinimum: row.stokMinimum !== null ? Number(row.stokMinimum) : null,
      barcode: row.barcode, foto: row.foto, aktif: row.aktif,
      createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "updateBarang error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /barang/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(barangTable).where(eq(barangTable.id, id));
    res.json({ ok: true, message: "Barang dihapus" });
  } catch (err) {
    req.log.error({ err }, "deleteBarang error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
