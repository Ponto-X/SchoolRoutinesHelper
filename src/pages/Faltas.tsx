import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useApp, Absence } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { TURMAS } from "./Contatos";

type FormData = { studentName: string; turma: string; date: string; reason: string };

export default function Faltas() {
  const { absences, contacts, addAbsence, updateAbsence, deleteAbsence, notifyParent, sendMessage } = useApp();
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
  const [form, setForm] = useState<FormData>({ studentName: "", turma: "", date: today, reason: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(today);

  const studentNames = useMemo(() => {
    const names = contacts.map(c => c.studentName);
    return [...new Set(names)].sort();
  }, [contacts]);

  const filtered = filterDate
    ? absences.filter(a => a.date === filterDate)
    : absences;

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.studentName.trim()) e.studentName = "Nome do aluno obrigatório";
    if (!form.turma) e.turma = "Turma obrigatória";
    if (!form.date) e.date = "Data obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setEditingAbsence(null);
    setForm({ studentName: "", turma: "", date: today, reason: "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (a: Absence) => {
    setEditingAbsence(a);
    setForm({ studentName: a.studentName, turma: a.turma, date: a.date, reason: a.reason });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingAbsence) {
      updateAbsence(editingAbsence.id, form);
      toast({ title: "Falta atualizada" });
    } else {
      addAbsence(form);
      toast({
        title: "Falta registrada",
        description: `Falta de ${form.studentName} registrada. Use o botão Notificar para avisar o responsável.`,
      });
    }
    setDialogOpen(false);
  };

  const handleNotify = (absence: Absence) => {
    const contact = contacts.find(c =>
      c.studentName.toLowerCase() === absence.studentName.toLowerCase() &&
      c.turma === absence.turma
    );

    notifyParent(absence.id);

    const message = `Olá! Somos do Colégio 21 de Abril. Notamos que ${absence.studentName} não compareceu à aula em ${absence.date}${absence.reason ? `. Motivo informado: ${absence.reason}` : ""}. Está tudo bem? Qualquer dúvida, estamos à disposição.`;

    sendMessage(
      contact ? contact.phone : `responsável de ${absence.studentName}`,
      message,
      "falta"
    );

    toast({
      title: "Notificação registrada",
      description: contact
        ? `Mensagem enviada para ${contact.parentName} (${contact.phone}).`
        : `Responsável de ${absence.studentName} notificado. Sem telefone cadastrado em Contatos.`,
    });
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteAbsence(deleteId);
    setDeleteId(null);
    toast({ title: "Falta excluída" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Controle de Faltas</h1>
          <p className="text-muted-foreground">Registre faltas e notifique responsáveis</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Registrar Falta</Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Filtrar por data:</label>
        <Input
          type="date"
          className="w-48"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        {filterDate && (
          <Button variant="outline" size="sm" onClick={() => setFilterDate("")}>Ver todas</Button>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {filterDate ? `Nenhuma falta em ${filterDate}.` : "Nenhuma falta registrada."}
        </p>
      )}

      <div className="space-y-3">
        {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map(absence => (
          <Card key={absence.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1 flex-1">
                <p className="font-medium">{absence.studentName}</p>
                <p className="text-sm text-muted-foreground">{absence.turma} • {absence.date}</p>
                {absence.reason && <p className="text-sm">Motivo: {absence.reason}</p>}
                {absence.notifiedAt && (
                  <p className="text-xs text-muted-foreground">
                    Notificado em {new Date(absence.notifiedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {absence.notified ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Notificado</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleNotify(absence)}>
                    <MessageSquare className="h-4 w-4 mr-1" /> Notificar
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(absence)} title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(absence.id)} title="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAbsence ? "Editar Falta" : "Registrar Falta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Select value={form.studentName} onValueChange={v => setForm({ ...form, studentName: v })}>
                <SelectTrigger><SelectValue placeholder="Aluno (de Contatos) *" /></SelectTrigger>
                <SelectContent>
                  {studentNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  <SelectItem value="__custom__">Digitar manualmente…</SelectItem>
                </SelectContent>
              </Select>
              {form.studentName === "__custom__" && (
                <Input
                  className="mt-2"
                  placeholder="Nome do aluno"
                  onChange={e => setForm({ ...form, studentName: e.target.value })}
                />
              )}
              {errors.studentName && <p className="text-xs text-destructive mt-1">{errors.studentName}</p>}
            </div>
            <div>
              <Select value={form.turma} onValueChange={v => setForm({ ...form, turma: v })}>
                <SelectTrigger><SelectValue placeholder="Turma *" /></SelectTrigger>
                <SelectContent>
                  {TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.turma && <p className="text-xs text-destructive mt-1">{errors.turma}</p>}
            </div>
            <div>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
            </div>
            <Textarea
              placeholder="Motivo (opcional)"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={2}
            />
            <Button onClick={handleSubmit} className="w-full">
              {editingAbsence ? "Salvar Alterações" : "Registrar Falta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de falta?</AlertDialogTitle>
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
