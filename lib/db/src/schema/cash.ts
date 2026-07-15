import { pgTable, serial, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cashTable = pgTable("cash", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  jenis: text("jenis").notNull(), // UangSetor | UangSisa | KasHarian
  denominasi: jsonb("denominasi").notNull(), // [{pecahan, jumlahLembar, subtotal}]
  total: numeric("total", { precision: 15, scale: 2 }).notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCashSchema = createInsertSchema(cashTable).omit({ id: true, createdAt: true });
export type InsertCash = z.infer<typeof insertCashSchema>;
export type Cash = typeof cashTable.$inferSelect;
