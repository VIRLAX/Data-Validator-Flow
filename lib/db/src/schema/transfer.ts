import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transferTable = pgTable("transfer", {
  id: serial("id").primaryKey(),
  tanggal: text("tanggal").notNull(),
  jenis: text("jenis").notNull(), // QRIS | TransferBank | EWallet
  nominal: numeric("nominal", { precision: 15, scale: 2 }).notNull(),
  keterangan: text("keterangan"),
  buktiFoto: text("bukti_foto"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransferSchema = createInsertSchema(transferTable).omit({ id: true, createdAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transfer = typeof transferTable.$inferSelect;
