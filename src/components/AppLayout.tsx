import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, Menu } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useState, useEffect } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

export default function AppLayout() {
  const navigate  = useNavigate();
  const { user, logout, loading } = useApp();
  const isMobile  = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  // Close on resize to desktop
  useEffect(() => { if (!isMobile) setMobileOpen(false); }, [isMobile]);

  const sidebarW = collapsed ? 64 : 220;

  return (
    <div className="min-h-screen bg-background">

      {/* ─── MOBILE: fullscreen sidebar overlay ─────────────────────── */}
      {isMobile && (
        <div
          className={[
            "fixed inset-0 z-50 transition-all duration-300",
            mobileOpen ? "visible" : "invisible",
          ].join(" ")}
        >
          {/* Backdrop */}
          <div
            className={[
              "absolute inset-0 bg-black/60 transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onClick={() => setMobileOpen(false)}
          />

          {/* Sidebar panel — full width on mobile */}
          <div
            className={[
              "absolute inset-y-0 left-0 w-full max-w-xs",
              "transition-transform duration-300 ease-in-out",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <AppSidebar
              isMobile
              onNavigate={() => setMobileOpen(false)}
              onCollapseChange={setCollapsed}
            />


          </div>
        </div>
      )}

      {/* ─── DESKTOP: fixed sidebar ──────────────────────────────────── */}
      {!isMobile && (
        <div className="fixed inset-y-0 left-0 z-40">
          <AppSidebar
            onNavigate={() => {}}
            onCollapseChange={setCollapsed}
          />
        </div>
      )}

      {/* ─── Main content ─────────────────────────────────────────────── */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : sidebarW }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center border-b bg-card/95 backdrop-blur-sm px-4 shadow-sm">
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted mr-3 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto min-w-0">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />}
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate max-w-[100px] sm:max-w-none">{user?.name}</span>
              {!isMobile && <span className="text-muted-foreground text-xs flex-shrink-0">({user?.role})</span>}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 min-w-0 overflow-x-hidden">
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
