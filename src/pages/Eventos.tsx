import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar as CalendarIcon, Pencil, Trash2, X } from "lucide-react";
import { useApp, Event } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

type FormData = { title: string; date: string };
const emptyForm: FormData = { title: "", date: "" };

export default function Eventos() {
  const { events, addEvent, updateEvent, deleteEvent, addChecklistItem, toggleChecklistItem, deleteChecklistItem } = useApp();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = "Nome obrigatório";
    if (!form.date) e.date = "Data obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (ev: Event) => {
    setEditingEvent(ev);
    setForm({ title: ev.title, date: ev.date });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingEvent) {
      updateEvent(editingEvent.id, { title: form.title, date: form.date });
      toast({ title: "Evento atualizado" });
    } else {
      addEvent({ title: form.title, date: form.date, checklist: [] });
      toast({ title: "Evento criado" });
    }
    setDialogOpen(false);
  };

  const handleAddItem = (eventId: string) => {
    const text = (newItemTexts[eventId] || "").trim();
    if (!text) return;
    addChecklistItem(eventId, text);
    setNewItemTexts(prev => ({ ...prev, [eventId]: "" }));
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteEvent(deleteId);
    setDeleteId(null);
    toast({ title: "Evento excluído" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Eventos</h1>
          <p className="text-muted-foreground">Eventos e checklists de preparação</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Evento</Button>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento cadastrado.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...events].sort((a, b) => a.date.localeCompare(b.date)).map(event => {
          const done = event.checklist.filter(c => c.done).length;
          const total = event.checklist.length;
          return (
            <Card key={event.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(event)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(event.id)} title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  {event.date}
                </div>
                {total > 0 && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                )}
                {total > 0 && (
                  <p className="text-xs text-muted-foreground">{done}/{total} itens concluídos</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {event.checklist.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item no checklist</p>
                ) : (
                  <ul className="space-y-2">
                    {event.checklist.map(item => (
                      <li key={item.id} className="flex items-center gap-2 group">
                        <Checkbox
                          checked={item.done}
                          onCheckedChange={() => toggleChecklistItem(event.id, item.id)}
                        />
                        <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                          {item.text}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => deleteChecklistItem(event.id, item.id)}
                          title="Remover item"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Add checklist item */}
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Nome do evento *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>
            <div>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingEvent ? "Salvar Alterações" : "Criar Evento"}
            </Button>
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
