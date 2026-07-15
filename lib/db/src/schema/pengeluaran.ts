import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pengeluaranTable = pgTable("pengeluaran", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  kategori: text("kategori").notNull(),
  nominal: numeric("nominal", { precision: 15, scale: 2 }).notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPengeluaranSchema = createInsertSchema(pengeluaranTable).omit({ id: true, createdAt: true });
export type InsertPengeluaran = z.infer<typeof insertPengeluaranSchema>;
export type Pengeluaran = typeof pengeluaranTable.$inferSelect;
