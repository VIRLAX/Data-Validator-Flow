import { pgTable, serial, text, numeric, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const barangTable = pgTable("barang", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  kategori: text("kategori").notNull().default("Umum"),
  satuan: text("satuan").notNull().default("Pcs"),
  hargaBeli: numeric("harga_beli", { precision: 15, scale: 2 }).notNull().default("0"),
  hargaJual: numeric("harga_jual", { precision: 15, scale: 2 }).notNull().default("0"),
  stok: numeric("stok", { precision: 15, scale: 2 }).notNull().default("0"),
  stokMinimum: numeric("stok_minimum", { precision: 15, scale: 2 }),
  barcode: text("barcode"),
  foto: text("foto"),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBarangSchema = createInsertSchema(barangTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBarang = z.infer<typeof insertBarangSchema>;
export type Barang = typeof barangTable.$inferSelect;
