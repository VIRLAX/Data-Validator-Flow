import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownToLine, 
  ShoppingCart, 
  Wallet, 
  ArrowRightLeft, 
  Banknote, 
  ClipboardCheck, 
  CheckSquare, 
  FileText,
  Menu,
  Store,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Master Barang", href: "/barang", icon: Package },
  { name: "Barang Masuk", href: "/barang-masuk", icon: ArrowDownToLine },
  { name: "Penjualan", href: "/penjualan", icon: ShoppingCart },
  { name: "Pengeluaran", href: "/pengeluaran", icon: Wallet },
  { name: "Transfer & QRIS", href: "/transfer", icon: ArrowRightLeft },
  { name: "Kas Harian", href: "/kas", icon: Banknote },
  { name: "Stok Harian", href: "/stok-harian", icon: ClipboardCheck },
  { name: "Validasi", href: "/validasi", icon: CheckSquare },
  { name: "Laporan", href: "/laporan", icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row font-sans">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-primary text-primary-foreground shadow-sm z-20">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Store className="w-6 h-6 text-secondary" /> Toko Sembako
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors rounded-md">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-sidebar text-sidebar-foreground shadow-xl z-40 transform transition-transform duration-200 ease-in-out flex flex-col
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6 flex items-center gap-3 font-bold text-xl tracking-tight border-b border-sidebar-border/50">
          <div className="bg-sidebar-primary p-2 rounded-lg text-sidebar-primary-foreground">
            <Store className="w-6 h-6" />
          </div>
          Toko Sembako
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 mt-2 px-3">Menu Operasional</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileOpen(false)} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border/50">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0) ?? "O"}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sidebar-foreground text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-sidebar-foreground/50 text-xs truncate">{user?.username}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-sidebar-foreground/50 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-card-border rounded-xl shadow-xl overflow-hidden z-50">
                <button
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Sistem
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background md:rounded-l-2xl md:shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] md:-ml-2 z-10 md:min-h-screen">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
