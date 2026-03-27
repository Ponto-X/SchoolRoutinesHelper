import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Calendar, UserX, MessageSquare } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function Dashboard() {
  const { tasks, events, absences, messageLogs } = useApp();

  const today = new Date().toISOString().split("T")[0];
  const endOfWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== "concluida").length, [tasks]);
  const weekEvents = useMemo(() => events.filter(e => e.date >= today && e.date <= endOfWeek).length, [events, today, endOfWeek]);
  const todayAbsences = useMemo(() => absences.filter(a => a.date === today).length, [absences, today]);
  const totalMessages = messageLogs.length;

  const stats = [
    { title: "Tarefas Pendentes", value: pendingTasks, icon: CheckSquare, color: "text-primary" },
    { title: "Eventos esta Semana", value: weekEvents, icon: Calendar, color: "text-secondary" },
    { title: "Faltas Hoje", value: todayAbsences, icon: UserX, color: "text-destructive" },
    { title: "Mensagens Enviadas", value: totalMessages, icon: MessageSquare, color: "text-muted-foreground" },
  ];

  const recentTasks = useMemo(
    () => tasks.filter(t => t.status !== "concluida").slice(0, 3),
    [tasks]
  );

  const upcomingEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
    [events]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumo do dia — Colégio 21 de Abril</p>
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
          <CardHeader>
            <CardTitle className="text-lg">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente 🎉</p>
            ) : (
              <ul className="space-y-3">
                {recentTasks.map(task => (
                  <li key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="text-sm">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === "atrasada" ? "bg-red-100 text-red-700" :
                      task.status === "em_andamento" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {task.status === "em_andamento" ? "Em andamento" :
                       task.status === "atrasada" ? "Atrasada" : "Pendente"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento cadastrado.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map(event => {
                  const done = event.checklist.filter(c => c.done).length;
                  const total = event.checklist.length;
                  return (
                    <li key={event.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <span className="text-sm">{event.title}</span>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{event.date}</div>
                        {total > 0 && (
                          <div className="text-xs text-muted-foreground">{done}/{total} itens</div>
                        )}
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
