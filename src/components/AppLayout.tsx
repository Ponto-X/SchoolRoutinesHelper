import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, Menu } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useState, useEffect } from "react";

// Sidebar widths — must match AppSidebar
const SIDEBAR_EXPANDED  = 220;
const SIDEBAR_COLLAPSED = 64;

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout, loading } = useApp();
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);

  // Listen for collapse state from sidebar via custom event
  useEffect(() => {
    const handler = (e: CustomEvent) => setCollapsed(e.detail.collapsed);
    window.addEventListener("sidebar-toggle" as never, handler as never);
    return () => window.removeEventListener("sidebar-toggle" as never, handler as never);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="min-h-screen flex w-full bg-background">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <AppSidebar
          onNavigate={() => setMobileOpen(false)}
          onCollapseChange={setCollapsed}
        />
      </div>

      {/* Main content — offset by sidebar width on desktop */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-10 h-14 flex items-center justify-between border-b bg-card/95 backdrop-blur-sm px-4 gap-3 flex-shrink-0 shadow-sm">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.name}</span>
              <span className="text-muted-foreground hidden sm:inline">({user?.role})</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 min-w-0">
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
