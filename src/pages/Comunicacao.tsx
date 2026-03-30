import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Clock, Loader2, Settings, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TURMAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { getConfig } from "@/lib/config";
import { Link } from "react-router-dom";

const RECIPIENTS = [
  { value: "todos", label: "Todos os pais" },
  ...TURMAS.map(t => ({ value: t, label: t })),
];

// Extract {{variables}} from text
function extractVars(text: string): string[] {
  return [...new Set((text.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/[{}]/g, "")))]
}

// Replace {{var}} with actual values
function fillTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || `{{${key}}}`);
}

export default function Comunicacao() {
  const { sendMessage, sendWhatsApp, messageLogs, contacts, canAccess, templates } = useApp();
  const { toast } = useToast();
  const canSend = canAccess("comunicacao");

  // Deduplicate templates by id
  const activeTemplates = templates.filter((t, i, arr) => t.active && arr.findIndex(x => x.id === t.id) === i);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [finalMessage, setFinalMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [varDialogOpen, setVarDialogOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<typeof activeTemplates[0] | null>(null);

  useEffect(() => {
    getConfig().then(cfg => {
      setWhatsappConfigured(!!cfg.VITE_WHATSAPP_PROVIDER && cfg.VITE_WHATSAPP_PROVIDER !== "none");
    });
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    const t = activeTemplates.find(t => t.id === templateId);
    if (!t) return;
    setSelectedTemplateId(templateId);

    const vars = extractVars(t.body);
    if (vars.length > 0) {
      // Has variables — open dialog to fill them
      setPendingTemplate(t);
      setVarValues(Object.fromEntries(vars.map(v => [v, ""])));
      setVarDialogOpen(true);
    } else {
      // No variables — use directly
      setFinalMessage(t.body);
    }
  };

  const handleApplyVars = () => {
    if (!pendingTemplate) return;
    setFinalMessage(fillTemplate(pendingTemplate.body, varValues));
    setVarDialogOpen(false);
    setPendingTemplate(null);
  };

  const getTargetContacts = () => {
    if (!recipient) return [];
    if (recipient === "todos") return contacts;
    return contacts.filter(c => c.turma === recipient);
  };

  const handleSend = async () => {
    if (!finalMessage.trim()) { toast({ title: "Erro", description: "Digite uma mensagem.", variant: "destructive" }); return; }
    if (!recipient) { toast({ title: "Erro", description: "Selecione um destinatário.", variant: "destructive" }); return; }

    const targets = getTargetContacts();
    setSending(true);

    const templateName = activeTemplates.find(t => t.id === selectedTemplateId)?.title || "manual";
    await sendMessage(recipient, finalMessage.trim(), templateName);

    if (whatsappConfigured && targets.length > 0) {
      let sent = 0;
      for (const contact of targets) {
        const result = await sendWhatsApp(contact.phone, finalMessage.trim());
        if (result.ok) sent++;
      }
      toast({
        title: sent > 0 ? `✅ ${sent} mensagem(ns) enviada(s)!` : "⚠️ Nenhuma enviada",
        description: `${sent}/${targets.length} via WhatsApp.`,
      });
    } else {
      toast({
        title: "Mensagem registrada",
        description: targets.length > 0
          ? `${targets.length} contato(s). ${!whatsappConfigured ? "WhatsApp não configurado." : ""}`
          : "Nenhum contato cadastrado para este destinatário.",
      });
    }

    setSending(false);
    setFinalMessage("");
    setRecipient("");
    setSelectedTemplateId("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comunicação</h1>
          <p className="text-muted-foreground">Envie mensagens para pais e responsáveis</p>
        </div>
        <Link to="/modelos">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" /> Gerenciar Modelos
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Enviar Mensagem
                <span className={`text-xs px-2 py-1 rounded-full font-normal ${whatsappConfigured ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {whatsappConfigured ? "✅ WhatsApp ativo" : "⚠️ WhatsApp não configurado"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Seleção de modelo */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Modelo de mensagem</label>
                <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                  <SelectTrigger><SelectValue placeholder="Escolha um modelo (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {activeTemplates.length === 0 && (
                      <SelectItem value="none" disabled>Nenhum modelo ativo</SelectItem>
                    )}
                    {activeTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
  
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destinatário */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Destinatário *</label>
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger><SelectValue placeholder="Selecione o destinatário" /></SelectTrigger>
                  <SelectContent>{RECIPIENTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
                {recipient && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {getTargetContacts().length} contato(s) cadastrado(s)
                  </p>
                )}
              </div>

              {/* Mensagem */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mensagem *</label>
                <Textarea
                  placeholder="Digite sua mensagem ou selecione um modelo acima…"
                  value={finalMessage}
                  onChange={e => setFinalMessage(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">{finalMessage.length} caracteres</p>
              </div>

              <Button onClick={handleSend} className="w-full" disabled={!canSend || sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending ? "Enviando…" : "Enviar via WhatsApp"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {/* Lista de modelos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Modelos disponíveis</CardTitle>
                <Link to="/modelos" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                  Ver todos <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum modelo ativo.{" "}
                  <Link to="/modelos" className="underline text-primary">Criar modelo</Link>
                </p>
              ) : (
                activeTemplates.slice(0, 5).map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors hover:bg-muted ${selectedTemplateId === t.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {t.body.replace(/\{\{\w+\}\}/g, '___').slice(0, 55)}…
                    </p>

                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Histórico */}
          {messageLogs.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Histórico recente</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-56 overflow-y-auto">
                {messageLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="border-b pb-2 last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs">{log.recipient}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.sentAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{log.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog para preencher variáveis */}
      <Dialog open={varDialogOpen} onOpenChange={setVarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preencha os campos do modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O modelo <strong>{pendingTemplate?.title}</strong> tem campos variáveis. Preencha abaixo:
            </p>
            {pendingTemplate && extractVars(pendingTemplate.body).map(v => (
              <div key={v}>
                <label className="text-sm font-medium mb-1 block capitalize">{v}</label>
                <Input
                  placeholder={`Digite o valor para {{${v}}}`}
                  value={varValues[v] || ""}
                  onChange={e => setVarValues(prev => ({ ...prev, [v]: e.target.value }))}
                />
              </div>
            ))}
            {pendingTemplate && (
              <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                <p className="text-xs font-medium mb-1">Prévia:</p>
                {fillTemplate(pendingTemplate.body, varValues)}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setVarDialogOpen(false); setFinalMessage(pendingTemplate?.body || ""); }}>
                Usar sem preencher
              </Button>
              <Button className="flex-1" onClick={handleApplyVars}>
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
