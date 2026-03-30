import {
  LayoutDashboard, CheckSquare, Calendar, MessageSquare,
  UserX, Users, GraduationCap, UsersRound, School, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import logoImg from "@/assets/logo-colegio.png";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const ALL_ITEMS = [
  { title: "Dashboard",     url: "/",             icon: LayoutDashboard, module: "dashboard",   group: "geral"    },
  { title: "Turmas",        url: "/turmas",        icon: School,          module: "turmas",      group: "escola"   },
  { title: "Alunos",        url: "/alunos",        icon: GraduationCap,   module: "students",    group: "escola"   },
  { title: "Colaboradores", url: "/colaboradores", icon: UsersRound,      module: "staff",       group: "escola"   },
  { title: "Tarefas",       url: "/tarefas",       icon: CheckSquare,     module: "tasks",       group: "gestao"   },
  { title: "Eventos",       url: "/eventos",       icon: Calendar,        module: "events",      group: "gestao"   },
  { title: "Faltas",        url: "/faltas",        icon: UserX,           module: "absences",    group: "gestao"   },
  { title: "Contatos",      url: "/contatos",      icon: Users,           module: "contacts",    group: "comunic"  },
  { title: "Comunicação",   url: "/comunicacao",   icon: MessageSquare,   module: "comunicacao", group: "comunic"  },
  { title: "Modelos",       url: "/modelos",       icon: FileText,        module: "comunicacao", group: "comunic"  },
];

const GROUPS = [
  { key: "geral",   label: "Geral"         },
  { key: "escola",  label: "Escola"        },
  { key: "gestao",  label: "Gestão"        },
  { key: "comunic", label: "Comunicação"   },
];

export function AppSidebar({ onNavigate, onCollapseChange }: { onNavigate?: () => void; onCollapseChange?: (c: boolean) => void }) {
  const location  = useLocation();
  const { canAccess } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (val: boolean) => {
    setCollapsed(val);
    onCollapseChange?.(val);
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { collapsed: val } }));
  };

  const items = ALL_ITEMS.filter(item =>
    item.module === "dashboard" || canAccess(item.module)
  );

  const isActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out",
        "bg-[#7B1A1A] text-white select-none",
        "h-screen overflow-hidden",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
      style={{
        background: "linear-gradient(160deg, #8B2020 0%, #6B1515 60%, #5A1010 100%)",
      }}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {/* Globe arcs referencing the logo */}
          <ellipse cx="50%" cy="102%" rx="85%" ry="50%" fill="none" stroke="white" strokeWidth="1"/>
          <ellipse cx="50%" cy="102%" rx="60%" ry="36%" fill="none" stroke="white" strokeWidth="1"/>
          <ellipse cx="50%" cy="102%" rx="34%" ry="22%" fill="none" stroke="white" strokeWidth="1"/>
          <line x1="0" y1="68%" x2="100%" y2="68%" stroke="white" strokeWidth="1"/>
          <line x1="0" y1="82%" x2="100%" y2="82%" stroke="white" strokeWidth="1"/>
          <line x1="0" y1="93%" x2="100%" y2="93%" stroke="white" strokeWidth="1"/>
        </svg>
      </div>

      {/* Logo area */}
      <div className={cn(
        "relative z-10 flex flex-col items-center pt-6 pb-4",
        "border-b border-white/10"
      )}>
        <div className={cn(
          "flex items-center justify-center transition-all duration-300",
          collapsed ? "w-10 h-10" : "w-24 h-24"
        )}>
          <img
            src={logoImg}
            alt="Colégio 21 de Abril"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>
        {!collapsed && (
          <div className="mt-1 text-center px-3">
            <p className="text-[11px] font-bold tracking-widest text-white/60 leading-tight uppercase">
              Colégio
            </p>
            <p className="text-sm font-bold text-white leading-tight">
              21 de Abril
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
        {GROUPS.map(group => {
          const groupItems = items.filter(i => i.group === group.key);
          if (groupItems.length === 0) return null;
          return (
            <div key={group.key}>
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 px-2 mb-1">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {groupItems.map(item => {
                  const active = isActive(item.url);
                  return (
                    <li key={item.url}>
                      <Link
                        to={item.url}
                        title={collapsed ? item.title : undefined}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-150",
                          active
                            ? "bg-white/20 text-white font-semibold shadow-sm"
                            : "text-white/70 hover:bg-white/10 hover:text-white",
                          collapsed && "justify-center px-0"
                        )}
                      >
                        {/* Active indicator bar */}
                        {active && !collapsed && (
                          <span className="absolute left-0 w-0.5 h-6 bg-white rounded-r-full" />
                        )}
                        <item.icon
                          className={cn(
                            "flex-shrink-0 transition-all",
                            collapsed ? "h-5 w-5" : "h-4 w-4",
                            active ? "text-white" : "text-white/60"
                          )}
                        />
                        {!collapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="relative z-10 border-t border-white/10 p-2">
        <button
          onClick={() => handleCollapse(!collapsed)}
          className={cn(
            "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs",
            collapsed && "justify-center"
          )}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>
          }
        </button>
      </div>
    </aside>
  );
}
