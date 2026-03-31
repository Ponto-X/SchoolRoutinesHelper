import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GraduationCap, UserCheck, Users, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Turma {
  id: string;
  name: string;
  year?: number;
  shift: string;
  active: boolean;
}

interface Student {
  id: string;
  name: string;
  turma: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  turmas: string[];
}

interface TurmaWithAssociations extends Turma {
  students: Student[];
  professors: StaffMember[];
  coordinators: StaffMember[];
  expanded: boolean;
}

type FormData = { name: string; year: string; shift: string; active: boolean };
const emptyForm: FormData = { name: "", year: "", shift: "Manhã", active: true };
const SHIFTS = ["Manhã", "Tarde", "Integral", "Noite"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Turmas() {
  const { canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("turmas");

  const [turmas, setTurmas] = useState<TurmaWithAssociations[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Association modals
  const [assocModal, setAssocModal] = useState<{
    turmaId: string;
    turmaName: string;
    type: "student" | "professor" | "coordinator";
  } | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    const sb = await getSupabase();
    const [turmasRes, studentsRes, staffRes] = await Promise.all([
      sb.from("turmas").select("*").order("name"),
      sb.from("students").select("id, name, turma").eq("active", true).order("name"),
      sb.from("staff").select("id, name, role, turmas").eq("active", true).order("name"),
    ]);

    const students: Student[] = (studentsRes.data || []).map(r => ({
      id: r.id as string, name: r.name as string, turma: r.turma as string,
    }));
    const staff: StaffMember[] = (staffRes.data || []).map(r => ({
      id: r.id as string, name: r.name as string, role: r.role as string,
      turmas: (r.turmas as string[]) || [],
    }));

    setAllStudents(students);
    setAllStaff(staff);

    const turmasData: TurmaWithAssociations[] = (turmasRes.data || []).map(r => {
      const name = r.name as string;
      return {
        id: r.id as string, name, year: r.year as number,
        shift: r.shift as string, active: r.active as boolean,
        expanded: false,
        students: students.filter(s => s.turma === name),
        professors: staff.filter(s => s.role === "Professor" && s.turmas.includes(name)),
        coordinators: staff.filter(s => s.role === "Coordenadora" && s.turmas.includes(name)),
      };
    });

    setTurmas(turmasData);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── CRUD Turma ────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (t: Turma) => {
    setEditing(t);
    setForm({ name: t.name, year: String(t.year || ""), shift: t.shift, active: t.active });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const sb = await getSupabase();
    const payload = {
      name: form.name.trim(),
      year: form.year ? parseInt(form.year) : null,
      shift: form.shift,
      active: form.active,
    };
    if (editing) {
      await sb.from("turmas").update(payload).eq("id", editing.id);
      // If name changed, update all students and staff with old name
      if (editing.name !== payload.name) {
        await sb.from("students").update({ turma: payload.name }).eq("turma", editing.name);
        // Update staff turmas arrays
        const affectedStaff = allStaff.filter(s => s.turmas.includes(editing.name));
        for (const s of affectedStaff) {
          const newTurmas = s.turmas.map(t => t === editing.name ? payload.name : t);
          await sb.from("staff").update({ turmas: newTurmas }).eq("id", s.id);
        }
      }
      toast({ title: "Turma atualizada" });
    } else {
      await sb.from("turmas").insert(payload);
      toast({ title: "Turma criada" });
    }
    setDialogOpen(false);
    loadAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const turma = turmas.find(t => t.id === deleteId);
    if (turma && turma.students.length > 0) {
      toast({ title: "Não é possível excluir", description: `${turma.students.length} aluno(s) estão nessa turma.`, variant: "destructive" });
      setDeleteId(null);
      return;
    }
    const sb = await getSupabase();
    await sb.from("turmas").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Turma excluída" });
    loadAll();
  };

  // ── Toggle expand ─────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setTurmas(prev => prev.map(t => t.id === id ? { ...t, expanded: !t.expanded } : t));
  };

  // ── Associations ──────────────────────────────────────────────────────────

  // Move student to this turma
  const assignStudent = async (studentId: string, turmaName: string) => {
    const sb = await getSupabase();
    await sb.from("students").update({ turma: turmaName }).eq("id", studentId);
    toast({ title: "Aluno associado à turma" });
    loadAll();
    setAssocModal(null);
  };

  // Remove student from turma (set turma to empty)
  const removeStudent = async (studentId: string) => {
    const sb = await getSupabase();
    await sb.from("students").update({ turma: "" }).eq("id", studentId);
    toast({ title: "Aluno removido da turma" });
    loadAll();
  };

  // Add/remove staff from turma
  const toggleStaffTurma = async (staffId: string, turmaName: string, add: boolean) => {
    const sb = await getSupabase();
    const member = allStaff.find(s => s.id === staffId);
    if (!member) return;
    const newTurmas = add
      ? [...member.turmas, turmaName]
      : member.turmas.filter(t => t !== turmaName);
    await sb.from("staff").update({ turmas: newTurmas }).eq("id", staffId);
    toast({ title: add ? "Colaborador associado" : "Colaborador removido" });
    loadAll();
    setAssocModal(null);
  };

  // ── Assoc modal content ───────────────────────────────────────────────────

  const AssocModal = () => {
    if (!assocModal) return null;
    const turma = turmas.find(t => t.id === assocModal.turmaId);
    if (!turma) return null;

    if (assocModal.type === "student") {
      // Students not yet in this turma
      const available = allStudents.filter(s => s.turma !== assocModal.turmaName);
      return (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {available.length === 0 && <p className="text-sm text-muted-foreground">Todos os alunos já estão nessa turma.</p>}
          {available.map(s => (
            <div key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">Turma atual: {s.turma || "Sem turma"}</p>
              </div>
              <Button size="sm" onClick={() => assignStudent(s.id, assocModal.turmaName)}>
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      );
    }

    // Staff (professor or coordinator)
    const role = assocModal.type === "professor" ? "Professor" : "Coordenadora";
    const eligible = allStaff.filter(s => s.role === role);
    return (
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {eligible.length === 0 && <p className="text-sm text-muted-foreground">Nenhum {role} cadastrado.</p>}
        {eligible.map(s => {
          const isAssociated = s.turmas.includes(assocModal.turmaName);
          return (
            <div key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
              <p className="text-sm font-medium">{s.name}</p>
              <Button
                size="sm"
                variant={isAssociated ? "destructive" : "default"}
                onClick={() => toggleStaffTurma(s.id, assocModal.turmaName, !isAssociated)}
              >
                {isAssociated ? "Remover" : "Associar"}
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turmas"
        description="Gerencie turmas, alunos e professores"
        action={canEdit ? <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Turma</Button> : undefined}
      />

      {/* Resumo */}
      <div className="flex gap-3">
        <Card className="flex-1"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{turmas.filter(t => t.active).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Turmas</p>
        </CardContent></Card>
        <Card className="flex-1"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{allStudents.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Alunos</p>
        </CardContent></Card>
        <Card className="flex-1"><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{allStudents.filter(s => !s.turma).length}</p>
          <p className="text-xs text-orange-500 mt-0.5">Sem turma</p>
        </CardContent></Card>
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando…</p>}

      {/* Turma cards */}
      <div className="space-y-4">
        {turmas.map(turma => (
          <Card key={turma.id} className={`transition-all ${!turma.active ? "opacity-60" : ""}`}>
            <CardContent className="p-0">
              {/* Header row */}
              <div className="flex items-center gap-2 px-4 py-3">
                {/* Expand toggle + name */}
                <button
                  onClick={() => toggleExpand(turma.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-75 text-left"
                >
                  {turma.expanded
                    ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                  <span className="font-semibold text-base truncate">{turma.name}</span>
                  <Badge variant="outline" className="flex-shrink-0 text-xs font-normal">{turma.shift}</Badge>
                  {!turma.active && <Badge variant="secondary" className="flex-shrink-0 text-xs">Inativa</Badge>}
                </button>
                {/* Actions */}
                {canEdit && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(turma)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(turma.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats strip — compact pill row */}
              <div className="flex gap-2 px-4 pb-3 border-t pt-2.5">
                <button
                  onClick={() => turma.active && setAssocModal({ turmaId: turma.id, turmaName: turma.name, type: "student" })}
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs transition-colors"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span className="font-semibold">{turma.students.length}</span>
                  <span className="hidden sm:inline">{turma.students.length === 1 ? "aluno" : "alunos"}</span>
                </button>
                <button
                  onClick={() => turma.active && setAssocModal({ turmaId: turma.id, turmaName: turma.name, type: "professor" })}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="font-semibold">{turma.professors.length}</span>
                  <span className="hidden sm:inline">{turma.professors.length === 1 ? "prof." : "profs."}</span>
                </button>
                <button
                  onClick={() => turma.active && setAssocModal({ turmaId: turma.id, turmaName: turma.name, type: "coordinator" })}
                  className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full px-3 py-1 text-xs transition-colors"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span className="font-semibold">{turma.coordinators.length}</span>
                  <span className="hidden sm:inline">{turma.coordinators.length === 1 ? "coord." : "coords."}</span>
                </button>
              </div>
            </CardContent>

            {/* Expanded content */}
            {turma.expanded && (
              <div className="border-t px-4 pb-4 pt-3 space-y-4">
                <div className="h-px bg-border" />

                {/* Professores */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <BookOpen className="h-4 w-4" /> Professores
                    </p>
                    {canEdit && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => setAssocModal({ turmaId: turma.id, turmaName: turma.name, type: "professor" })}>
                        <Plus className="h-3 w-3 mr-1" /> Gerenciar
                      </Button>
                    )}
                  </div>
                  {turma.professors.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum professor associado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {turma.professors.map(p => (
                        <div key={p.id} className="flex items-center gap-1 bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {p.name}
                          {canEdit && (
                            <button onClick={() => toggleStaffTurma(p.id, turma.name, false)}
                              className="ml-1 hover:text-red-600">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coordenadores */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <UserCheck className="h-4 w-4" /> Coordenadores
                    </p>
                    {canEdit && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => setAssocModal({ turmaId: turma.id, turmaName: turma.name, type: "coordinator" })}>
                        <Plus className="h-3 w-3 mr-1" /> Gerenciar
                      </Button>
                    )}
                  </div>
                  {turma.coordinators.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum coordenador associado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {turma.coordinators.map(c => (
                        <div key={c.id} className="flex items-center gap-1 bg-purple-50 text-purple-800 text-xs px-2 py-1 rounded-full">
                          {c.name}
                          {canEdit && (
                            <button onClick={() => toggleStaffTurma(c.id, turma.name, false)}
                              className="ml-1 hover:text-red-600">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alunos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <Users className="h-4 w-4" /> Alunos ({turma.students.length})
                    </p>
                    {canEdit && (
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => setAssocModal({ turmaId: turma.id, turmaName: turma.name, type: "student" })}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar aluno
                      </Button>
                    )}
                  </div>
                  {turma.students.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum aluno nessa turma.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {turma.students.map(s => (
                        <div key={s.id} className="flex items-center justify-between bg-muted rounded px-2 py-1.5">
                          <p className="text-sm">{s.name}</p>
                          {canEdit && (
                            <button onClick={() => removeStudent(s.id)}
                              className="text-muted-foreground hover:text-destructive text-xs ml-2">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Turma" : "Nova Turma"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Nome da turma (ex: 1º Ano A) *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Ano (ex: 1, 2, 3)" value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })} min={1} max={9} />
              <Select value={form.shift} onValueChange={v => setForm({ ...form, shift: v })}>
                <SelectTrigger><SelectValue placeholder="Turno" /></SelectTrigger>
                <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activeTurma" checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="activeTurma" className="text-sm">Turma ativa</label>
            </div>
            <Button onClick={handleSubmit} className="w-full">{editing ? "Salvar" : "Criar Turma"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Association Modal */}
      <Dialog open={!!assocModal} onOpenChange={open => !open && setAssocModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assocModal?.type === "student" && `Adicionar alunos — ${assocModal.turmaName}`}
              {assocModal?.type === "professor" && `Professores — ${assocModal.turmaName}`}
              {assocModal?.type === "coordinator" && `Coordenadores — ${assocModal.turmaName}`}
            </DialogTitle>
          </DialogHeader>
          <AssocModal />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir turma?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Turmas com alunos não podem ser excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
