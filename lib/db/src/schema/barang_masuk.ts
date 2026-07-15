import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { barangTable } from "./barang";

export const barangMasukTable = pgTable("barang_masuk", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  supplier: text("supplier").notNull(),
  barangId: integer("barang_id").notNull().references(() => barangTable.id),
  jumlah: numeric("jumlah", { precision: 15, scale: 2 }).notNull(),
  harga: numeric("harga", { precision: 15, scale: 2 }).notNull(),
  totalHarga: numeric("total_harga", { precision: 15, scale: 2 }).notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBarangMasukSchema = createInsertSchema(barangMasukTable).omit({ id: true, createdAt: true });
export type InsertBarangMasuk = z.infer<typeof insertBarangMasukSchema>;
export type BarangMasuk = typeof barangMasukTable.$inferSelect;
