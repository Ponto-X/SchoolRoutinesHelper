import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useApp, Absence } from "@/context/AppContext";
import { TURMAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

type FormData = { studentName: string; turma: string; date: string; reason: string };

// Students with 3+ absences are at risk
const RISK_THRESHOLD = 3;

export default function Faltas() {
  const { absences, absenceSummary, contacts, addAbsence, updateAbsence, deleteAbsence, notifyParent, sendMessage, sendWhatsApp, canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("absences");
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

  const filtered = filterDate ? absences.filter(a => a.date === filterDate) : absences;
  const atRisk = absenceSummary.filter(s => s.total >= RISK_THRESHOLD);

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.studentName.trim()) e.studentName = "Nome do aluno obrigatório";
    if (!form.turma)              e.turma = "Turma obrigatória";
    if (!form.date)               e.date = "Data obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditingAbsence(null); setForm({ studentName: "", turma: "", date: today, reason: "" }); setErrors({}); setDialogOpen(true); };
  const openEdit = (a: Absence) => { setEditingAbsence(a); setForm({ studentName: a.studentName, turma: a.turma, date: a.date, reason: a.reason }); setErrors({}); setDialogOpen(true); };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editingAbsence) {
      await updateAbsence(editingAbsence.id, form);
      toast({ title: "Falta atualizada" });
    } else {
      await addAbsence(form);
      toast({ title: "Falta registrada", description: `Use o botão Notificar para avisar o responsável de ${form.studentName}.` });
    }
    setDialogOpen(false);
  };

  const handleNotify = async (absence: Absence) => {
    const contact = contacts.find(c =>
      c.studentName.toLowerCase() === absence.studentName.toLowerCase() && c.turma === absence.turma
    );

    const message = `Olá! Somos do Colégio 21 de Abril. Notamos que ${absence.studentName} não compareceu à aula em ${absence.date}${absence.reason ? `. Motivo informado: ${absence.reason}` : ""}. Está tudo bem? Qualquer dúvida, estamos à disposição.`;

    await notifyParent(absence.id);
    await sendMessage(contact?.phone || `responsável de ${absence.studentName}`, message, "falta");

    // Try real WhatsApp if contact has phone
    if (contact?.phone) {
      const result = await sendWhatsApp(contact.phone, message);
      if (result.ok) {
        toast({ title: "✅ WhatsApp enviado!", description: `Mensagem enviada para ${contact.parentName} (${contact.phone}).` });
      } else {
        toast({ title: "Notificação registrada", description: `WhatsApp não configurado (${result.error}). Registro salvo no histórico.`, variant: "destructive" });
      }
    } else {
      toast({ title: "Notificação registrada", description: `Sem telefone cadastrado para ${absence.studentName}. Cadastre em Contatos.` });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteAbsence(deleteId);
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
        {canEdit && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Registrar Falta</Button>}
      </div>

      {/* At-risk alert */}
      {atRisk.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertTriangle className="h-4 w-4" />
            {atRisk.length} aluno(s) com {RISK_THRESHOLD}+ faltas — risco de reprovação por frequência
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {atRisk.map(s => (
              <span key={s.studentName} className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                {s.studentName} ({s.total} faltas)
              </span>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="diario">
        <TabsList>
          <TabsTrigger value="diario">Por dia</TabsTrigger>
          <TabsTrigger value="historico">
            Histórico por aluno
            {atRisk.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{atRisk.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Por dia */}
        <TabsContent value="diario" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Filtrar por data:</label>
            <Input type="date" className="w-48" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            {filterDate && <Button variant="outline" size="sm" onClick={() => setFilterDate("")}>Ver todas</Button>}
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
                      canEdit && (
                        <Button size="sm" variant="outline" onClick={() => handleNotify(absence)}>
                          <MessageSquare className="h-4 w-4 mr-1" /> Notificar
                        </Button>
                      )
                    )}
                    {canEdit && (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(absence)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(absence.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Histórico por aluno */}
        <TabsContent value="historico" className="space-y-3 mt-4">
          {absenceSummary.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma falta registrada.</p>
          )}
          {absenceSummary.map(summary => (
            <Card key={summary.studentName} className={summary.total >= RISK_THRESHOLD ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{summary.studentName}</p>
                    <p className="text-sm text-muted-foreground">{summary.turma}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${summary.total >= RISK_THRESHOLD ? "text-red-600" : "text-foreground"}`}>
                      {summary.total}
                    </span>
                    <p className="text-xs text-muted-foreground">faltas</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {summary.absences.map(a => (
                    <span key={a.id} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {a.date}{a.reason ? ` (${a.reason})` : ""}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAbsence ? "Editar Falta" : "Registrar Falta"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Select value={form.studentName} onValueChange={v => setForm({ ...form, studentName: v })}>
                <SelectTrigger><SelectValue placeholder="Aluno *" /></SelectTrigger>
                <SelectContent>
                  {studentNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  <SelectItem value="__custom__">Digitar manualmente…</SelectItem>
                </SelectContent>
              </Select>
              {form.studentName === "__custom__" && (
                <Input className="mt-2" placeholder="Nome do aluno" onChange={e => setForm({ ...form, studentName: e.target.value })} />
              )}
              {errors.studentName && <p className="text-xs text-destructive mt-1">{errors.studentName}</p>}
            </div>
            <div>
              <Select value={form.turma} onValueChange={v => setForm({ ...form, turma: v })}>
                <SelectTrigger><SelectValue placeholder="Turma *" /></SelectTrigger>
                <SelectContent>{TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {errors.turma && <p className="text-xs text-destructive mt-1">{errors.turma}</p>}
            </div>
            <div>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
            </div>
            <Textarea placeholder="Motivo (opcional)" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} />
            <Button onClick={handleSubmit} className="w-full">{editingAbsence ? "Salvar Alterações" : "Registrar Falta"}</Button>
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
