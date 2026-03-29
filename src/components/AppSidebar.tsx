import {
  LayoutDashboard, CheckSquare, Calendar,
  MessageSquare, UserX, Users,
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
  { title: "Dashboard",    url: "/",            icon: LayoutDashboard, module: "dashboard"   },
  { title: "Tarefas",      url: "/tarefas",     icon: CheckSquare,     module: "tasks"       },
  { title: "Eventos",      url: "/eventos",     icon: Calendar,        module: "events"      },
  { title: "Contatos",     url: "/contatos",    icon: Users,           module: "contacts"    },
  { title: "Faltas",       url: "/faltas",      icon: UserX,           module: "absences"    },
  { title: "Comunicação",  url: "/comunicacao", icon: MessageSquare,   module: "comunicacao" },
];

export function AppSidebar() {
  const { state }  = useSidebar();
  const collapsed  = state === "collapsed";
  const location   = useLocation();
  const { canAccess } = useApp();

  // Dashboard is always visible; other items filtered by role
  const items = ALL_ITEMS.filter(item =>
    item.module === "dashboard" || canAccess(item.module)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex items-center justify-center">
        <img
          src={logoImg}
          alt="Colégio 21 de Abril"
          className={collapsed ? "w-8 h-8" : "w-16 h-16"}
        />
        {!collapsed && (
          <span className="text-sm font-bold text-sidebar-foreground mt-2 text-center leading-tight">
            Colégio 21 de Abril
          </span>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
