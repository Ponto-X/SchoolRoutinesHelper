import {
  LayoutDashboard, CheckSquare, Calendar, MessageSquare,
  UserX, Users, GraduationCap, UsersRound, School, FileText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import logoImg from "@/assets/logo-colegio.png";
import { useApp } from "@/context/AppContext";

const ALL_ITEMS = [
  { title: "Dashboard",     url: "/",             icon: LayoutDashboard, module: "dashboard"  },
  { title: "Turmas",        url: "/turmas",        icon: School,          module: "turmas"     },
  { title: "Alunos",        url: "/alunos",        icon: GraduationCap,   module: "students"   },
  { title: "Colaboradores", url: "/colaboradores", icon: UsersRound,      module: "staff"      },
  { title: "Tarefas",       url: "/tarefas",       icon: CheckSquare,     module: "tasks"      },
  { title: "Eventos",       url: "/eventos",       icon: Calendar,        module: "events"     },
  { title: "Contatos",      url: "/contatos",      icon: Users,           module: "contacts"   },
  { title: "Faltas",        url: "/faltas",        icon: UserX,           module: "absences"   },
  { title: "Comunicação",   url: "/comunicacao",   icon: MessageSquare,   module: "comunicacao"},
  { title: "Modelos",       url: "/modelos",       icon: FileText,        module: "comunicacao"},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed  = state === "collapsed";
  const location   = useLocation();
  const { canAccess } = useApp();

  const items = ALL_ITEMS.filter(item =>
    item.module === "dashboard" || canAccess(item.module)
  );

  return (
    <Sidebar collapsible="icon">
      {/* Decorative globe arcs in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", bottom: 0, left: 0 }}>
          <ellipse cx="50%" cy="110%" rx="90%" ry="55%" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>
          <ellipse cx="50%" cy="110%" rx="65%" ry="40%" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>
          <ellipse cx="50%" cy="110%" rx="38%" ry="24%" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>
          <line x1="0" y1="72%" x2="100%" y2="72%" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          <line x1="0" y1="85%" x2="100%" y2="85%" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          <line x1="0" y1="96%" x2="100%" y2="96%" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        </svg>
      </div>

      <SidebarHeader className="p-4 flex flex-col items-center justify-center relative z-10">
        <div className={`relative ${collapsed ? "w-9 h-9" : "w-20 h-20"} transition-all`}>
          <img
            src={logoImg}
            alt="Colégio 21 de Abril"
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-sidebar-foreground mt-2 text-center leading-tight opacity-90">
            Colégio 21 de Abril
          </span>
        )}
      </SidebarHeader>

      <SidebarContent className="relative z-10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs tracking-wider uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-white/10 transition-colors rounded-md"
                      activeClassName="bg-white/15 text-white font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
