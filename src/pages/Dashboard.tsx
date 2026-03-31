import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Calendar, UserX, MessageSquare, Bell, AlertTriangle, GraduationCap, UsersRound, School, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "@/lib/supabase";

export default function Dashboard() {
  const { tasks, events, absences, messageLogs, urgentEvents, absenceSummary, user, canAccess } = useApp();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const endOfWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // DB counts
  const [counts, setCounts] = useState({ students: 0, staff: 0, turmas: 0 });
  const loadCounts = useCallback(async () => {
    const sb = await getSupabase();
    const [s, st, t] = await Promise.all([
      sb.from("students").select("id", { count: "exact", head: true }).eq("active", true),
      sb.from("staff").select("id", { count: "exact", head: true }).eq("active", true),
      sb.from("turmas").select("id", { count: "exact", head: true }).eq("active", true),
    ]);
    setCounts({ students: s.count || 0, staff: st.count || 0, turmas: t.count || 0 });
  }, []);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  // Derived stats — corrigidos
  const pendingTasks    = useMemo(() => tasks.filter(t => t.status !== "concluida").length, [tasks]);
  const overdueTasks    = useMemo(() => tasks.filter(t => t.status === "atrasada").length, [tasks]);
  const upcomingEvents  = useMemo(() => events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [events, today]);
  const weekEvents      = useMemo(() => upcomingEvents.filter(e => e.date <= endOfWeek).length, [upcomingEvents, endOfWeek]);
  const todayAbsences   = useMemo(() => absences.filter(a => a.date === today).length, [absences, today]);
  const monthAbsences   = useMemo(() => absences.filter(a => a.date >= startOfMonth).length, [absences, startOfMonth]);
  const pendingNotify   = useMemo(() => absences.filter(a => !a.notified).length, [absences]);
  const monthMessages   = useMemo(() => messageLogs.filter(m => m.sentAt >= startOfMonth).length, [messageLogs, startOfMonth]);
  const atRiskStudents  = useMemo(() => absenceSummary.filter(s => s.total >= 3), [absenceSummary]);
  const recentTasks     = useMemo(() => tasks.filter(t => t.status !== "concluida").sort((a, b) => {
    // Atrasadas primeiro, depois por data
    if (a.status === "atrasada" && b.status !== "atrasada") return -1;
    if (b.status === "atrasada" && a.status !== "atrasada") return 1;
    return a.dueDate.localeCompare(b.dueDate);
  }).slice(0, 5), [tasks]);

  const statusLabel: Record<string, string> = {
    atrasada: "Atrasada", em_andamento: "Em andamento", pendente: "Pendente", concluida: "Concluída",
  };
  const statusColor: Record<string, string> = {
    atrasada: "bg-red-100 text-red-700",
    em_andamento: "bg-blue-100 text-blue-700",
    pendente: "bg-yellow-100 text-yellow-700",
    concluida: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Olá, <strong>{user?.name}</strong> — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {/* Alertas */}
      {(overdueTasks > 0 || urgentEvents.length > 0 || atRiskStudents.length > 0 || pendingNotify > 0) && (
        <div className="space-y-2">
          {overdueTasks > 0 && (
            <button onClick={() => navigate("/tarefas")}
              className="w-full flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 hover:bg-red-100 transition-colors text-left">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate"><strong>{overdueTasks} tarefa(s) atrasada(s)</strong> — clique para ver</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </button>
          )}
          {urgentEvents.length > 0 && (
            <button onClick={() => navigate("/eventos")}
              className="w-full flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 transition-colors text-left">
              <Bell className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate"><strong>{urgentEvents.length} evento(s)</strong> nos próximos 3 dias</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </button>
          )}
          {atRiskStudents.length > 0 && (
            <button onClick={() => navigate("/faltas")}
              className="w-full flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 text-sm text-orange-800 hover:bg-orange-100 transition-colors text-left">
              <UserX className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate"><strong>{atRiskStudents.length} aluno(s)</strong> com 3+ faltas</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </button>
          )}
          {pendingNotify > 0 && (
            <button onClick={() => navigate("/faltas")}
              className="w-full flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-800 hover:bg-blue-100 transition-colors text-left">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 min-w-0 truncate"><strong>{pendingNotify} falta(s)</strong> aguardando notificação</span>
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* Cards de entidade (escola) */}
      <div className="grid grid-cols-3 gap-3">
        {canAccess("turmas") && (
          <button onClick={() => navigate("/turmas")} className="text-left w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><School className="h-5 w-5 text-red-600" /></div>
                <p className="text-2xl font-bold leading-none">{counts.turmas}</p>
                <p className="text-xs text-muted-foreground">Turmas</p>
              </CardContent>
            </Card>
          </button>
        )}
        {canAccess("students") && (
          <button onClick={() => navigate("/alunos")} className="text-left w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-green-600" /></div>
                <p className="text-2xl font-bold leading-none">{counts.students}</p>
                <p className="text-xs text-muted-foreground">Alunos</p>
              </CardContent>
            </Card>
          </button>
        )}
        {canAccess("staff") && (
          <button onClick={() => navigate("/colaboradores")} className="text-left w-full">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><UsersRound className="h-5 w-5 text-purple-600" /></div>
                <p className="text-2xl font-bold leading-none">{counts.staff}</p>
                <p className="text-xs text-muted-foreground">Colab.</p>
              </CardContent>
            </Card>
          </button>
        )}
      </div>

      {/* Stats operacionais */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate("/tarefas")} className="text-left w-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground leading-tight">Tarefas{"\n"}Pendentes</p>
                <CheckSquare className="h-4 w-4 text-primary flex-shrink-0" />
              </div>
              <p className="text-3xl font-bold">{pendingTasks}</p>
              {overdueTasks > 0 && <p className="text-xs text-red-600 mt-1">{overdueTasks} atrasada(s)</p>}
            </CardContent>
          </Card>
        </button>

        <button onClick={() => navigate("/eventos")} className="text-left w-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Eventos (7 dias)</p>
                <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
              </div>
              <p className="text-3xl font-bold">{weekEvents}</p>
              <p className="text-xs text-muted-foreground mt-1">{upcomingEvents.length} total futuros</p>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => navigate("/faltas")} className="text-left w-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Faltas Hoje</p>
                <UserX className="h-4 w-4 text-destructive flex-shrink-0" />
              </div>
              <p className="text-3xl font-bold">{todayAbsences}</p>
              <p className="text-xs text-muted-foreground mt-1">{monthAbsences} no mês</p>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => navigate("/comunicacao")} className="text-left w-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Mensagens (mês)</p>
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-3xl font-bold">{monthMessages}</p>
              <p className="text-xs text-muted-foreground mt-1">{messageLogs.length} total</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Tarefas + Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tarefas Prioritárias</CardTitle>
            <button onClick={() => navigate("/tarefas")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente 🎉</p>
            ) : (
              <ul className="space-y-2">
                {recentTasks.map(task => (
                  <li key={task.id} className="flex items-start justify-between gap-2 p-2.5 bg-muted rounded-md">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.assignee} • {task.dueDate}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${statusColor[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            <button onClick={() => navigate("/eventos")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento futuro.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.slice(0, 5).map(event => {
                  const done  = event.checklist.filter(c => c.done).length;
                  const total = event.checklist.length;
                  const days  = Math.round((new Date(event.date).getTime() - Date.now()) / 86400000);
                  const pct   = total > 0 ? Math.round((done / total) * 100) : null;
                  return (
                    <li key={event.id} className={`p-2.5 rounded-md ${days <= 3 ? "bg-amber-50" : "bg-muted"}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{event.title}</p>
                        <span className={`text-xs font-medium ${days <= 3 ? "text-amber-700" : "text-muted-foreground"}`}>
                          {days === 0 ? "Hoje!" : days === 1 ? "Amanhã" : `${days}d`}
                        </span>
                      </div>
                      {pct !== null && (
                        <div className="mt-1.5">
                          <div className="w-full bg-background rounded-full h-1.5">
                            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{done}/{total} itens do checklist</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Faltas sem notificação */}
      {pendingNotify > 0 && canAccess("absences") && (
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Aguardando Notificação</CardTitle>
            <button onClick={() => navigate("/faltas")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Ir para Faltas <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {absences.filter(a => !a.notified).slice(0, 10).map(a => (
                <span key={a.id} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {a.studentName} • {a.date}
                </span>
              ))}
              {pendingNotify > 10 && (
                <span className="text-xs text-muted-foreground self-center">+{pendingNotify - 10} mais</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
