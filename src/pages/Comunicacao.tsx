import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { TURMAS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const templates = [
  { id: "falta",   title: "Falta de Aluno",   text: "Olá! Somos do Colégio 21 de Abril. Notamos que seu(a) filho(a) não compareceu à aula hoje. Está tudo bem? Gostaríamos de saber se há algo que possamos ajudar." },
  { id: "reuniao", title: "Reunião de Pais",   text: "Olá! O Colégio 21 de Abril convida para a reunião de pais que acontecerá no dia [DATA] às [HORA]. Contamos com sua presença!" },
  { id: "evento",  title: "Evento Escolar",    text: "Olá! Informamos que o Colégio 21 de Abril realizará o evento [NOME DO EVENTO] no dia [DATA]. Mais detalhes serão enviados em breve!" },
  { id: "geral",   title: "Comunicado Geral",  text: "Olá! Comunicado do Colégio 21 de Abril: " },
];

const RECIPIENTS = [
  { value: "todos", label: "Todos os pais" },
  ...TURMAS.map(t => ({ value: t, label: t })),
];

export default function Comunicacao() {
  const { sendMessage, sendWhatsApp, messageLogs, contacts, canAccess } = useApp();
  const { toast } = useToast();
  const canSend = canAccess("comunicacao");

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const t = templates.find(t => t.id === templateId);
    if (t) setMessage(t.text);
  };

  const getTargetContacts = () => {
    if (!recipient) return [];
    if (recipient === "todos") return contacts;
    return contacts.filter(c => c.turma === recipient);
  };

  const handleSend = async () => {
    if (!message.trim()) { toast({ title: "Erro", description: "Digite uma mensagem.", variant: "destructive" }); return; }
    if (!recipient)       { toast({ title: "Erro", description: "Selecione um destinatário.", variant: "destructive" }); return; }

    const targets = getTargetContacts();
    setSending(true);

    // Log in DB
    await sendMessage(recipient, message.trim(), selectedTemplate || "manual");

    // Try real WhatsApp for each contact
    const hasStevo = !!import.meta.env.VITE_STEVO_API_KEY;
    if (hasStevo && targets.length > 0) {
      let sent = 0;
      for (const contact of targets) {
        const result = await sendWhatsApp(contact.phone, message.trim());
        if (result.ok) sent++;
      }
      toast({
        title: sent === targets.length ? "✅ WhatsApp enviado!" : `⚠️ Enviado para ${sent}/${targets.length}`,
        description: `${sent} mensagem(ns) enviada(s) via WhatsApp.`,
      });
    } else {
      toast({
        title: "Mensagem registrada",
        description: hasStevo
          ? `${targets.length} contato(s) — WhatsApp sendo enviado…`
          : `${targets.length} contato(s). Configure VITE_STEVO_API_KEY para enviar via WhatsApp.`,
      });
    }

    setSending(false);
    setMessage("");
    setRecipient("");
    setSelectedTemplate("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunicação</h1>
        <p className="text-muted-foreground">Envie mensagens para pais e responsáveis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Enviar Mensagem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger><SelectValue placeholder="Escolha um modelo (opcional)" /></SelectTrigger>
                <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
              </Select>

              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger><SelectValue placeholder="Destinatário *" /></SelectTrigger>
                <SelectContent>{RECIPIENTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>

              {recipient && (
                <p className="text-xs text-muted-foreground">
                  {getTargetContacts().length} contato(s) cadastrado(s) para este destinatário.
                </p>
              )}

              <Textarea placeholder="Digite sua mensagem…" value={message} onChange={e => setMessage(e.target.value)} rows={5} />

              <Button onClick={handleSend} className="w-full" disabled={!canSend || sending}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {sending ? "Enviando…" : "Enviar via WhatsApp"}
              </Button>

              {!import.meta.env.VITE_STEVO_API_KEY && (
                <p className="text-xs text-muted-foreground text-center">
                  Configure VITE_STEVO_API_KEY no Railway para ativar envio real via WhatsApp.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Modelos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {templates.map(t => (
                <Button key={t.id} variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleTemplateChange(t.id)}>
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.text.slice(0, 50)}…</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {messageLogs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Histórico</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                {messageLogs.slice(0, 20).map(log => (
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
    </div>
  );
}
