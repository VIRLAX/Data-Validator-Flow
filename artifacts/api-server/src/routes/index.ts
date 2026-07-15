import { Router, type IRouter } from "express";
import { requireAuth } from "../middleware/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import barangRouter from "./barang";
import barangMasukRouter from "./barang-masuk";
import penjualanRouter from "./penjualan";
import pengeluaranRouter from "./pengeluaran";
import transferRouter from "./transfer";
import cashRouter from "./cash";
import stokHarianRouter from "./stok-harian";
import validasiRouter from "./validasi";
import laporanRouter from "./laporan";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use("/auth", authRouter);

// Protected routes — all require valid JWT
router.use(requireAuth);
router.use("/barang", barangRouter);
router.use("/barang-masuk", barangMasukRouter);
router.use("/penjualan", penjualanRouter);
router.use("/pengeluaran", pengeluaranRouter);
router.use("/transfer", transferRouter);
router.use("/cash", cashRouter);
router.use("/stok-harian", stokHarianRouter);
router.use("/validasi", validasiRouter);
router.use("/laporan", laporanRouter);
router.use("/dashboard", dashboardRouter);

export default router;
