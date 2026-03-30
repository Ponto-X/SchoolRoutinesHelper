import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Calendar, UserX, MessageSquare, Bell, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function Dashboard() {
  const { tasks, events, absences, messageLogs, urgentEvents, absenceSummary, user } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const endOfWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const pendingTasks  = useMemo(() => tasks.filter(t => t.status !== "concluida").length, [tasks]);
  const overdueTasks  = useMemo(() => tasks.filter(t => t.status === "atrasada").length, [tasks]);
  const weekEvents    = useMemo(() => events.filter(e => e.date >= today && e.date <= endOfWeek).length, [events, today, endOfWeek]);
  const todayAbsences = useMemo(() => absences.filter(a => a.date === today).length, [absences, today]);
  const atRiskStudents = useMemo(() => absenceSummary.filter(s => s.total >= 3).length, [absenceSummary]);

  const stats = [
    { title: "Tarefas Pendentes", value: pendingTasks, icon: CheckSquare, color: "text-primary"          },
    { title: "Eventos esta Semana", value: weekEvents, icon: Calendar,    color: "text-secondary"         },
    { title: "Faltas Hoje",        value: todayAbsences, icon: UserX,     color: "text-destructive"       },
    { title: "Mensagens Enviadas", value: messageLogs.length, icon: MessageSquare, color: "text-muted-foreground" },
  ];

  const recentTasks   = useMemo(() => tasks.filter(t => t.status !== "concluida").slice(0, 3), [tasks]);
  const upcomingEvents = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3), [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Olá, {user?.name} ({user?.role}) — Colégio 21 de Abril</p>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {overdueTasks > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span><strong>{overdueTasks} tarefa(s) atrasada(s)</strong> — prazo vencido e ainda não concluídas.</span>
          </div>
        )}
        {urgentEvents.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
            <Bell className="h-4 w-4 flex-shrink-0" />
            <span><strong>{urgentEvents.length} evento(s)</strong> nos próximos 3 dias: {urgentEvents.map(e => e.title).join(", ")}.</span>
          </div>
        )}
        {atRiskStudents > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 text-sm text-orange-800">
            <UserX className="h-4 w-4 flex-shrink-0" />
            <span><strong>{atRiskStudents} aluno(s)</strong> com 3+ faltas — risco de reprovação por frequência.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Tarefas Pendentes</CardTitle></CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente 🎉</p>
            ) : (
              <ul className="space-y-3">
                {recentTasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="text-sm">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === "atrasada"     ? "bg-red-100 text-red-700"    :
                      task.status === "em_andamento" ? "bg-blue-100 text-blue-700"  :
                                                       "bg-yellow-100 text-yellow-700"
                    }`}>
                      {task.status === "em_andamento" ? "Em andamento" : task.status === "atrasada" ? "Atrasada" : "Pendente"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Próximos Eventos</CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map(event => {
                  const done = event.checklist.filter(c => c.done).length;
                  const total = event.checklist.length;
                  const days = Math.round((new Date(event.date).getTime() - Date.now()) / 86400000);
                  return (
                    <li key={event.id} className={`flex items-center justify-between p-3 rounded-md ${days <= 3 && days >= 0 ? "bg-amber-50" : "bg-muted"}`}>
                      <span className="text-sm">{event.title}</span>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{event.date}</div>
                        {total > 0 && <div className="text-xs text-muted-foreground">{done}/{total} itens</div>}
                        {days >= 0 && days <= 3 && <div className="text-xs text-amber-700 font-medium">{days === 0 ? "Hoje!" : `${days}d`}</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// Dashboard already complete - no changes needed for now
