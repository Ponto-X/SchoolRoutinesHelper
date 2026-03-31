import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Copy, Tag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useApp, MessageTemplate } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "geral",   label: "Geral" },
  { value: "faltas",  label: "Faltas" },
  { value: "eventos", label: "Eventos" },
  { value: "tarefas", label: "Tarefas" },
];

const categoryColor: Record<string, string> = {
  geral:   "bg-gray-100 text-gray-700",
  faltas:  "bg-red-100 text-red-700",
  eventos: "bg-amber-100 text-amber-700",
  tarefas: "bg-blue-100 text-blue-700",
};

type FormData = { title: string; body: string; category: string; active: boolean };
const emptyForm: FormData = { title: "", body: "", category: "geral", active: true };

export default function Modelos() {
  const { templates, addTemplate, updateTemplate, deleteTemplate, canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("comunicacao");

  const [filterCategory, setFilterCategory] = useState("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = filterCategory === "todas"
    ? templates
    : templates.filter(t => t.category === filterCategory);

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = "Título obrigatório";
    if (!form.body.trim())  e.body  = "Mensagem obrigatória";
    if (!form.category)     e.category = "Categoria obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (t: MessageTemplate) => {
    setEditing(t);
    setForm({ title: t.title, body: t.body, category: t.category, active: t.active });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editing) {
      await updateTemplate(editing.id, form);
      toast({ title: "Modelo atualizado" });
    } else {
      await addTemplate(form);
      toast({ title: "Modelo criado" });
    }
    setDialogOpen(false);
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast({ title: "Copiado!", description: "Texto do modelo copiado." });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteTemplate(deleteId);
    setDeleteId(null);
    toast({ title: "Modelo excluído" });
  };

  // Extract {{variables}} from template body
  const extractVars = (body: string) =>
    [...new Set((body.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/[{}]/g, "")))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos"
        description="Modelos para comunicação com os pais"
        action={canEdit ? <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Modelo</Button> : undefined}
      />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filterCategory === "todas" ? "default" : "outline"} size="sm" onClick={() => setFilterCategory("todas")}>
          Todos ({templates.length})
        </Button>
        {CATEGORIES.map(c => (
          <Button key={c.value} variant={filterCategory === c.value ? "default" : "outline"} size="sm" onClick={() => setFilterCategory(c.value)}>
            {c.label} ({templates.filter(t => t.category === c.value).length})
          </Button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum modelo encontrado.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(template => {
          const vars = extractVars(template.body);
          return (
            <Card key={template.id} className={!template.active ? "opacity-50" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{template.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColor[template.category] || categoryColor.geral}`}>
                        {CATEGORIES.find(c => c.value === template.category)?.label}
                      </span>
                      {!template.active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inativo</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{template.body}</p>
                  </div>
                </div>

                {vars.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground mt-0.5" />
                    {vars.map(v => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {"{{"}{v}{"}}"}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCopy(template.body)}>
                    <Copy className="h-3 w-3 mr-1" /> Copiar
                  </Button>
                  {canEdit && (
                    <>
                      <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => openEdit(template)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(template.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Título do modelo *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
            </div>

            <div>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Categoria *" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
            </div>

            <div>
              <Textarea
                placeholder="Texto da mensagem *&#10;&#10;Use {{variavel}} para campos dinâmicos.&#10;Ex: {{aluno}}, {{data}}, {{turma}}"
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                rows={5}
              />
              {errors.body && <p className="text-xs text-destructive mt-1">{errors.body}</p>}
              {form.body && extractVars(form.body).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-muted-foreground">Variáveis detectadas:</span>
                  {extractVars(form.body).map(v => (
                    <Badge key={v} variant="outline" className="text-xs">{"{{"}{v}{"}}"}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm">Modelo ativo</label>
            </div>

            <Button onClick={handleSubmit} className="w-full">
              {editing ? "Salvar Alterações" : "Criar Modelo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
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
