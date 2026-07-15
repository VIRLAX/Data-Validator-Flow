import { pgTable, serial, text, numeric, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const penjualanTable = pgTable("penjualan", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  nomorTransaksi: text("nomor_transaksi").notNull().unique(),
  items: jsonb("items").notNull(),
  totalHarga: numeric("total_harga", { precision: 15, scale: 2 }).notNull(),
  diskonTotal: numeric("diskon_total", { precision: 15, scale: 2 }).notNull().default("0"),
  labaKotor: numeric("laba_kotor", { precision: 15, scale: 2 }).notNull().default("0"),
  metodePembayaran: text("metode_pembayaran").notNull().default("Cash"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPenjualanSchema = createInsertSchema(penjualanTable).omit({ id: true, createdAt: true });
export type InsertPenjualan = z.infer<typeof insertPenjualanSchema>;
export type Penjualan = typeof penjualanTable.$inferSelect;
