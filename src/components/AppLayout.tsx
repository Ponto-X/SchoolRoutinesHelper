import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout, loading } = useApp();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-end border-b bg-card px-4 gap-3 flex-shrink-0">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user?.name}</span>
            <span className="text-muted-foreground hidden sm:inline">({user?.role})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando dados…</span>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
