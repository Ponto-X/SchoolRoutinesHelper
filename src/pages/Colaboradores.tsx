import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { TURMAS, ROLES } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Staff {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  turmas: string[];
  active: boolean;
  createdAt: string;
}

type FormData = {
  name: string; role: string; email: string;
  phone: string; turmas: string[]; active: boolean;
};

const emptyForm: FormData = { name: "", role: "", email: "", phone: "", turmas: [], active: true };

const ROLE_COLORS: Record<string, string> = {
  Diretora:     "bg-purple-100 text-purple-700",
  Coordenadora: "bg-blue-100 text-blue-700",
  Secretaria:   "bg-green-100 text-green-700",
  Professor:    "bg-orange-100 text-orange-700",
};

function mapStaff(r: Record<string, unknown>): Staff {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as string,
    email: r.email as string,
    phone: r.phone as string,
    turmas: (r.turmas as string[]) || [],
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

export default function Colaboradores() {
  const { canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("staff");

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = await getSupabase();
    const { data } = await sb.from("staff").select("*").order("name");
    setStaff((data || []).map(r => mapStaff(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "todos" || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório" as unknown as string;
    if (!form.role) e.role = "Cargo obrigatório" as unknown as string;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role, email: s.email || "", phone: s.phone || "", turmas: s.turmas, active: s.active });
    setErrors({});
    setDialogOpen(true);
  };

  const toggleTurma = (turma: string) => {
    setForm(prev => ({
      ...prev,
      turmas: prev.turmas.includes(turma)
        ? prev.turmas.filter(t => t !== turma)
        : [...prev.turmas, turma],
    }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const sb = await getSupabase();
    const payload = {
      name: form.name, role: form.role,
      email: form.email || null,
      phone: form.phone || null,
      turmas: form.turmas,
      active: form.active,
    };
    if (editing) {
      await sb.from("staff").update(payload).eq("id", editing.id);
      toast({ title: "Colaborador atualizado" });
    } else {
      await sb.from("staff").insert(payload);
      toast({ title: "Colaborador cadastrado" });
    }
    setDialogOpen(false);
    load();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const sb = await getSupabase();
    await sb.from("staff").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Colaborador removido" });
    load();
  };

  const roleNames = Object.values(ROLES);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground">Equipe do colégio</p>
        </div>
        {canEdit && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Colaborador</Button>}
      </div>

      {/* Resumo por cargo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {roleNames.map(role => (
          <Card key={role} className={`cursor-pointer transition-all ${filterRole === role ? "border-primary" : ""}`}
            onClick={() => setFilterRole(filterRole === role ? "todos" : role)}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{staff.filter(s => s.role === role && s.active).length}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar colaborador…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Cargo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os cargos</SelectItem>
            {roleNames.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-muted-foreground text-center py-8">Carregando…</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum colaborador encontrado.</p>
      )}

      <div className="space-y-3">
        {filtered.map(member => (
          <Card key={member.id} className={!member.active ? "opacity-60" : ""}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{member.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[member.role] || "bg-gray-100 text-gray-700"}`}>
                    {member.role}
                  </span>
                  {!member.active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {member.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{member.phone}</span>}
                  {member.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{member.email}</span>}
                </div>
                {member.turmas.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {member.turmas.map(t => (
                      <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-2 ml-4">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(member)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(member.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Input placeholder="Nome completo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive mt-1">{String(errors.name)}</p>}
            </div>
            <div>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue placeholder="Cargo *" /></SelectTrigger>
                <SelectContent>{roleNames.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-destructive mt-1">{String(errors.role)}</p>}
            </div>
            <Input placeholder="Telefone / WhatsApp" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
            <Input placeholder="E-mail" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <div>
              <p className="text-sm font-medium mb-2">Turmas que leciona / atende:</p>
              <div className="grid grid-cols-3 gap-2">
                {TURMAS.map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <Checkbox id={t} checked={form.turmas.includes(t)} onCheckedChange={() => toggleTurma(t)} />
                    <label htmlFor={t} className="text-sm cursor-pointer">{t}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activeStaff" checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="activeStaff" className="text-sm">Colaborador ativo</label>
            </div>
            <Button onClick={handleSubmit} className="w-full">{editing ? "Salvar" : "Cadastrar Colaborador"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
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
