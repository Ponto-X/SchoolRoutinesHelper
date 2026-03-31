import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, CheckCircle, Clock, AlertCircle, Pencil, Trash2, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp, Task, TaskStatus } from "@/context/AppContext";
import { getSupabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CYCLE: TaskStatus[] = ["pendente", "em_andamento", "concluida", "atrasada"];

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Clock; className: string }> = {
  pendente:     { label: "Pendente",     icon: Clock,        className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  em_andamento: { label: "Em andamento", icon: AlertCircle,  className: "bg-blue-100 text-blue-700 border border-blue-200"   },
  concluida:    { label: "Concluída",    icon: CheckCircle,  className: "bg-green-100 text-green-700 border border-green-200"  },
  atrasada:     { label: "Atrasada",     icon: AlertCircle,  className: "bg-red-100 text-red-700 border border-red-200"      },
};

type FormData = { title: string; description: string; assignee: string; dueDate: string; status: TaskStatus };
const emptyForm: FormData = { title: "", description: "", assignee: "", dueDate: "", status: "pendente" };

export default function Tarefas() {
  const { tasks, addTask, updateTask, deleteTask, canAccess } = useApp();
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    getSupabase().then(sb =>
      sb.from("staff").select("name").eq("active", true).order("name")
        .then(({ data }) => { if (data) setAssignees(data.map((r: Record<string, unknown>) => r.name as string)); })
    );
  }, []);
  const { toast } = useToast();
  const canEdit = canAccess("tasks");

  const [filter, setFilter] = useState<string>("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const filtered = filter === "todas" ? tasks : tasks.filter(t => t.status === filter);

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = "Título obrigatório";
    if (!form.assignee)     e.assignee = "Responsável obrigatório";
    if (!form.dueDate)      e.dueDate = "Prazo obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditingTask(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description, assignee: task.assignee, dueDate: task.dueDate, status: task.status });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editingTask) {
      await updateTask(editingTask.id, form);
      toast({ title: "Tarefa atualizada" });
    } else {
      await addTask(form);
      toast({ title: "Tarefa criada" });
    }
    setDialogOpen(false);
  };

  const cycleStatus = async (task: Task) => {
    if (!canEdit) return;
    const idx = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    await updateTask(task.id, { status: next });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteTask(deleteId);
    setDeleteId(null);
    toast({ title: "Tarefa excluída" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Gerencie as tarefas da equipe"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Tarefa</Button>}
      />

      {/* Overdue alert */}
      {tasks.filter(t => t.status === "atrasada").length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <strong>{tasks.filter(t => t.status === "atrasada").length} tarefa(s) atrasada(s)</strong> — prazo já passou e ainda não foram concluídas.
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["todas", ...STATUS_CYCLE] as const).map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "todas" ? "Todas" : statusConfig[s as TaskStatus].label}
            {s !== "todas" && (
              <span className="ml-1 text-xs opacity-70">
                ({tasks.filter(t => t.status === s).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma tarefa encontrada.</p>
        )}
        {filtered.map(task => {
          const config = statusConfig[task.status];
          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div
                  className={`flex-1 space-y-1 ${canEdit ? "cursor-pointer" : ""}`}
                  onClick={() => canEdit && cycleStatus(task)}
                  title={canEdit ? "Clique para avançar o status" : ""}
                >
                  <p className={`font-medium ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{task.assignee} • Prazo: {task.dueDate}</p>
                  {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>{config.label}</span>
                  {canEdit ? (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(task)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Título da tarefa *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>
            <Textarea placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div>
              <Select value={form.assignee} onValueChange={v => setForm({ ...form, assignee: v })}>
                <SelectTrigger><SelectValue placeholder="Responsável *" /></SelectTrigger>
                <SelectContent>
                  {assignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.assignee && <p className="text-xs text-destructive mt-1">{errors.assignee}</p>}
            </div>
            <div>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              {errors.dueDate && <p className="text-xs text-destructive mt-1">{errors.dueDate}</p>}
            </div>
            {editingTask && (
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as TaskStatus })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_CYCLE.map(s => <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleSubmit} className="w-full">{editingTask ? "Salvar Alterações" : "Criar Tarefa"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
