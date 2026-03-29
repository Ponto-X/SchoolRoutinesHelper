import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Phone, Search, Pencil, Trash2 } from "lucide-react";
import { useApp, Contact } from "@/context/AppContext";
import { TURMAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const PHONE_REGEX = /^55\d{10,11}$/;

type FormData = { studentName: string; parentName: string; phone: string; turma: string };
const emptyForm: FormData = { studentName: "", parentName: "", phone: "", turma: "" };

export default function Contatos() {
  const { contacts, addContact, updateContact, deleteContact, canAccess } = useApp();
  const { toast } = useToast();
  const canEdit = canAccess("contacts");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = contacts.filter(c =>
    c.studentName.toLowerCase().includes(search.toLowerCase()) ||
    c.parentName.toLowerCase().includes(search.toLowerCase()) ||
    c.turma.toLowerCase().includes(search.toLowerCase())
  );

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.studentName.trim()) e.studentName = "Nome do aluno obrigatório";
    if (!form.parentName.trim())  e.parentName = "Nome do responsável obrigatório";
    if (!form.phone.trim()) {
      e.phone = "Telefone obrigatório";
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      e.phone = "Formato inválido. Use: 5511999990000 (DDI 55 + DDD + número)";
    }
    if (!form.turma) e.turma = "Turma obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setEditingContact(null); setForm(emptyForm); setErrors({}); setDialogOpen(true); };
  const openEdit = (c: Contact) => { setEditingContact(c); setForm({ studentName: c.studentName, parentName: c.parentName, phone: c.phone, turma: c.turma }); setErrors({}); setDialogOpen(true); };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (editingContact) {
      await updateContact(editingContact.id, form);
      toast({ title: "Contato atualizado" });
    } else {
      await addContact(form);
      toast({ title: "Contato adicionado" });
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await deleteContact(deleteId);
    setDeleteId(null);
    toast({ title: "Contato removido" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-muted-foreground">Pais e responsáveis dos alunos</p>
        </div>
        {canEdit && <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Contato</Button>}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por aluno, responsável ou turma…" className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {search ? "Nenhum contato encontrado." : "Nenhum contato cadastrado."}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map(contact => (
          <Card key={contact.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <p className="font-medium">{contact.studentName}</p>
                <p className="text-sm text-muted-foreground">Responsável: {contact.parentName}</p>
                <p className="text-sm text-muted-foreground">Turma: {contact.turma}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />{contact.phone}
                </div>
                {canEdit && (
                  <>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(contact)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(contact.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingContact ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Input placeholder="Nome do aluno *" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} />
              {errors.studentName && <p className="text-xs text-destructive mt-1">{errors.studentName}</p>}
            </div>
            <div>
              <Input placeholder="Nome do responsável *" value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} />
              {errors.parentName && <p className="text-xs text-destructive mt-1">{errors.parentName}</p>}
            </div>
            <div>
              <Input placeholder="WhatsApp: 5511999990000 *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Select value={form.turma} onValueChange={v => setForm({ ...form, turma: v })}>
                <SelectTrigger><SelectValue placeholder="Turma *" /></SelectTrigger>
                <SelectContent>{TURMAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              {errors.turma && <p className="text-xs text-destructive mt-1">{errors.turma}</p>}
            </div>
            <Button onClick={handleSubmit} className="w-full">{editingContact ? "Salvar Alterações" : "Adicionar Contato"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover contato?</AlertDialogTitle>
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
