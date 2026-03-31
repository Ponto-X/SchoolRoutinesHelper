import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar as CalendarIcon, Pencil, Trash2, X, Bell } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp, Event } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

type FormData = { title: string; date: string };
const emptyForm: FormData = { title: "", date: "" };

function daysUntil(date: string): number {
  return Math.round((new Date(date).getTime() - Date.now()) / 86400000);
}

export default function Eventos() {
  const { events, urgentEvents, addEvent, updateEvent, deleteEvent, addChecklistItem, toggleChecklistItem, deleteChecklistItem, canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("events");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = "Nome obrigatório";
    if (!form.date)         e.date = "Data obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditingEvent(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (ev: Event) => { setEditingEvent(ev); setForm({ title: ev.title, date: ev.date }); setErrors({}); setDialogOpen(true); };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editingEvent) {
      await updateEvent(editingEvent.id, { title: form.title, date: form.date });
      toast({ title: "Evento atualizado" });
    } else {
      await addEvent({ title: form.title, date: form.date, checklist: [] });
      toast({ title: "Evento criado" });
    }
    setDialogOpen(false);
  };

  const handleAddItem = async (eventId: string) => {
    const text = (newItemTexts[eventId] || "").trim();
    if (!text) return;
    await addChecklistItem(eventId, text);
    setNewItemTexts(prev => ({ ...prev, [eventId]: "" }));
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteEvent(deleteId);
    setDeleteId(null);
    toast({ title: "Evento excluído" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de Eventos"
        description="Eventos e checklists de preparação"
        action={canEdit ? <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Evento</Button> : undefined}
      />

      {/* Urgent events alert */}
      {urgentEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-medium mb-1">
            <Bell className="h-4 w-4" />
            {urgentEvents.length} evento(s) nos próximos 3 dias!
          </div>
          <div className="flex flex-wrap gap-2">
            {urgentEvents.map(e => {
              const days = daysUntil(e.date);
              const done = e.checklist.filter(c => c.done).length;
              const total = e.checklist.length;
              return (
                <span key={e.id} className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full">
                  {e.title} — {days === 0 ? "hoje!" : `em ${days} dia(s)`}
                  {total > 0 && ` (${done}/${total} itens)`}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento cadastrado.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...events].sort((a, b) => a.date.localeCompare(b.date)).map(event => {
          const done = event.checklist.filter(c => c.done).length;
          const total = event.checklist.length;
          const days = daysUntil(event.date);
          const isUrgent = days >= 0 && days <= 3;

          return (
            <Card key={event.id} className={isUrgent ? "border-amber-300" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                  <div className="flex gap-1 flex-shrink-0">
                    {canEdit && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(event)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(event.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />{event.date}
                  </div>
                  {isUrgent && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      {days === 0 ? "Hoje!" : `${days}d`}
                    </span>
                  )}
                </div>
                {total > 0 && (
                  <>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{done}/{total} itens concluídos</p>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {event.checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item no checklist</p>
                ) : (
                  <ul className="space-y-2">
                    {event.checklist.map(item => (
                      <li key={item.id} className="flex items-center gap-2 group">
                        <Checkbox checked={item.done} onCheckedChange={() => toggleChecklistItem(event.id, item.id)} />
                        <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                        {canEdit && (
                          <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteChecklistItem(event.id, item.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canEdit && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Novo item…"
                      className="h-8 text-sm"
                      value={newItemTexts[event.id] || ""}
                      onChange={e => setNewItemTexts(prev => ({ ...prev, [event.id]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && handleAddItem(event.id)}
                    />
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleAddItem(event.id)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Nome do evento *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>
            <div>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
            </div>
            <Button onClick={handleSubmit} className="w-full">{editingEvent ? "Salvar Alterações" : "Criar Evento"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
            <AlertDialogDescription>O checklist também será removido. Esta ação não pode ser desfeita.</AlertDialogDescription>
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
