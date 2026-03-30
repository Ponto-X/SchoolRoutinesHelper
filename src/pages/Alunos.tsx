import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, GraduationCap, Phone } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { TURMAS } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  turma: string;
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: string;
}

type FormData = {
  name: string; turma: string; birthDate: string;
  parentName: string; parentPhone: string; parentEmail: string;
  address: string; notes: string; active: boolean;
};

const emptyForm: FormData = {
  name: "", turma: "", birthDate: "", parentName: "",
  parentPhone: "", parentEmail: "", address: "", notes: "", active: true,
};

function mapStudent(r: Record<string, unknown>): Student {
  return {
    id: r.id as string,
    name: r.name as string,
    turma: r.turma as string,
    birthDate: r.birth_date as string,
    parentName: r.parent_name as string,
    parentPhone: r.parent_phone as string,
    parentEmail: r.parent_email as string,
    address: r.address as string,
    notes: r.notes as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

export default function Alunos() {
  const { canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTurma, setFilterTurma] = useState("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = await getSupabase();
    const { data } = await sb.from("students").select("*").order("name");
    setStudents((data || []).map(r => mapStudent(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.parentName || "").toLowerCase().includes(search.toLowerCase());
    const matchTurma = filterTurma === "todas" || s.turma === filterTurma;
    return matchSearch && matchTurma;
  });

  const byTurma = TURMAS.map(t => ({
    turma: t,
    count: students.filter(s => s.turma === t && s.active).length,
  }));

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.turma) e.turma = "Turma obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name, turma: s.turma, birthDate: s.birthDate || "",
      parentName: s.parentName || "", parentPhone: s.parentPhone || "",
      parentEmail: s.parentEmail || "", address: s.address || "",
      notes: s.notes || "", active: s.active,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const sb = await getSupabase();
    const payload = {
      name: form.name, turma: form.turma,
      birth_date: form.birthDate || null,
      parent_name: form.parentName || null,
      parent_phone: form.parentPhone || null,
      parent_email: form.parentEmail || null,
      address: form.address || null,
      notes: form.notes || null,
      active: form.active,
    };
    if (editing) {
      await sb.from("students").update(payload).eq("id", editing.id);
      toast({ title: "Aluno atualizado" });
    } else {
      await sb.from("students").insert(payload);
      toast({ title: "Aluno cadastrado" });
    }
    setDialogOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const sb = await getSupabase();
    await sb.from("students").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Aluno removido" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Cadastro e gestão de alunos</p>
        </div>
        {canEdit && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Aluno</Button>}
      </div>

      {/* Resumo por turma */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {byTurma.map(({ turma, count }) => (
          <Card key={turma} className={`cursor-pointer transition-all ${filterTurma === turma ? "border-primary" : ""}`}
            onClick={() => setFilterTurma(filterTurma === turma ? "todas" : turma)}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{turma}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aluno ou responsável…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterTurma} onValueChange={setFilterTurma}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Turma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as turmas</SelectItem>
            {TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando…</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno encontrado.</p>
      )}

      <div className="space-y-3">
        {filtered.map(student => (
          <Card key={student.id} className={!student.active ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{student.name}</p>
                  {!student.active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{student.turma}</span>
                  {student.parentName && <span>Resp: {student.parentName}</span>}
                  {student.parentPhone && (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{student.parentPhone}</span>
                  )}
                  {student.birthDate && <span>Nasc: {student.birthDate}</span>}
                </div>
                {student.notes && <p className="text-xs text-muted-foreground">{student.notes}</p>}
              </div>
              {canEdit && (
                <div className="flex gap-2 ml-4">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(student)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(student.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Aluno" : "Novo Aluno"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Input placeholder="Nome completo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Select value={form.turma} onValueChange={v => setForm({ ...form, turma: v })}>
                <SelectTrigger><SelectValue placeholder="Turma *" /></SelectTrigger>
                <SelectContent>{TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {errors.turma && <p className="text-xs text-destructive mt-1">{errors.turma}</p>}
            </div>
            <Input type="date" placeholder="Data de nascimento" value={form.birthDate}
              onChange={e => setForm({ ...form, birthDate: e.target.value })} />
            <Input placeholder="Nome do responsável" value={form.parentName}
              onChange={e => setForm({ ...form, parentName: e.target.value })} />
            <Input placeholder="WhatsApp do responsável (5511999990000)" value={form.parentPhone}
              onChange={e => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, "") })} />
            <Input placeholder="E-mail do responsável" value={form.parentEmail}
              onChange={e => setForm({ ...form, parentEmail: e.target.value })} />
            <Input placeholder="Endereço" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })} />
            <Textarea placeholder="Observações" value={form.notes} rows={2}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active" className="text-sm">Aluno ativo</label>
            </div>
            <Button onClick={handleSubmit} className="w-full">{editing ? "Salvar" : "Cadastrar Aluno"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover aluno?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
