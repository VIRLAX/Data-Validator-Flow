# Toko Sembako — Sistem Manajemen Toko Sembako

Sistem operasional digital lengkap untuk toko sembako — menggantikan buku catatan dengan dashboard, pencatatan transaksi, validasi stok & keuangan otomatis, dan laporan.

## Run & Operate

- `pnpm --filter @workspace/toko-sembako run dev` — frontend (port 23055)
- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts + Wouter
- API: Express 5 + Zod validation
- DB: PostgreSQL + Drizzle ORM
- Codegen: Orval (OpenAPI → React Query hooks + Zod schemas)

## Where things live

- `artifacts/toko-sembako/` — React frontend (pages, components, routing)
- `artifacts/api-server/src/routes/` — Express API route handlers
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/` — Drizzle DB schema (barang, penjualan, pengeluaran, transfer, cash, stok_harian)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)

## Pages & Features

| Page | Route | Fungsi |
|------|-------|--------|
| Dashboard | `/` | Ringkasan harian, grafik 30 hari, stok per kategori |
| Master Barang | `/barang` | CRUD produk (nama, satuan, harga beli/jual, stok) |
| Barang Masuk | `/barang-masuk` | Catat kiriman supplier, stok otomatis bertambah |
| Penjualan | `/penjualan` | Transaksi multi-item, hitung laba otomatis |
| Pengeluaran | `/pengeluaran` | Catat biaya operasional harian |
| Transfer & QRIS | `/transfer` | Transaksi non-tunai (QRIS, Bank, E-Wallet) |
| Kas Harian | `/kas` | Input denominasi uang, hitung total otomatis |
| Stok Harian | `/stok-harian` | Opname stok fisik |
| Validasi | `/validasi` | Bandingkan stok sistem vs fisik, validasi keuangan |
| Laporan | `/laporan` | Laporan harian/mingguan/bulanan/tahunan |

## Architecture decisions

- OpenAPI-first: semua contract API didefinisikan di `lib/api-spec/openapi.yaml`, frontend menggunakan generated hooks
- Stok otomatis berubah saat barang masuk/penjualan dibuat atau dihapus
- Cash menggunakan JSONB untuk menyimpan denominasi lembar uang
- Validasi keuangan: bandingkan total penjualan vs cash+transfer+QRIS yang tercatat
- Semua angka disimpan sebagai NUMERIC(15,2) untuk akurasi — tidak ada floating point error

## User preferences

- Semua UI dalam Bahasa Indonesia
- Format currency: Rp 1.000.000 (titik sebagai pemisah ribuan)
- Jangan gunakan emoji di UI

## Gotchas

- Setelah mengubah `lib/api-spec/openapi.yaml`, wajib jalankan codegen sebelum menggunakan hooks yang baru
- `pnpm run typecheck:libs` harus dijalankan dulu setelah mengubah `lib/db/src/schema/` agar tipe tersedia di artifact
- Jangan jalankan `pnpm dev` di root — gunakan WorkflowsRestart tool

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
