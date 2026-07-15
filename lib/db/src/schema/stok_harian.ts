import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stokHarianTable = pgTable("stok_harian", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  items: jsonb("items").notNull(), // [{barangId, barangNama, stokFisik, stokSistem, selisih, status}]
  status: text("status").notNull().default("VALID"), // VALID | TIDAK_VALID
  catatan: text("catatan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStokHarianSchema = createInsertSchema(stokHarianTable).omit({ id: true, createdAt: true });
export type InsertStokHarian = z.infer<typeof insertStokHarianSchema>;
export type StokHarian = typeof stokHarianTable.$inferSelect;
