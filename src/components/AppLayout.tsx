import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, Menu } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useState } from "react";

const SIDEBAR_W  = 220;
const COLLAPSED_W = 64;

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout, loading } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* Mobile: slides in over content (no margin shift) */}
      {/* Desktop: fixed, content has margin-left */}
      <div className={`
        fixed inset-y-0 left-0 z-40
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>
        <AppSidebar
          onNavigate={() => setMobileOpen(false)}
          onCollapseChange={setCollapsed}
        />
      </div>

      {/* ── Main content ── */}
      {/* Mobile: full width (sidebar overlays, doesn't push) */}
      {/* Desktop: offset by sidebar width */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: `var(--sidebar-offset, 0)` }}
      >
        {/* CSS var set per breakpoint */}
        <style>{`
          @media (min-width: 768px) {
            :root { --sidebar-offset: ${collapsed ? COLLAPSED_W : SIDEBAR_W}px; }
          }
          @media (max-width: 767px) {
            :root { --sidebar-offset: 0px; }
          }
        `}</style>

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-20 h-14 flex items-center border-b bg-card/95 backdrop-blur-sm px-4 shadow-sm">
          {/* Hamburger - mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted mr-2"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <div className="flex items-center gap-1.5 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.name}</span>
              <span className="text-muted-foreground hidden sm:inline">({user?.role})</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando…</span>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
