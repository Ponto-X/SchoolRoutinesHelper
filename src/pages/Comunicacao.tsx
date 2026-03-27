import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { TURMAS } from "./Contatos";

const templates = [
  { id: "falta", title: "Falta de Aluno", text: "Olá! Somos do Colégio 21 de Abril. Notamos que seu(a) filho(a) não compareceu à aula hoje. Está tudo bem? Gostaríamos de saber se há algo que possamos ajudar." },
  { id: "reuniao", title: "Reunião de Pais", text: "Olá! O Colégio 21 de Abril convida para a reunião de pais que acontecerá no dia [DATA] às [HORA]. Contamos com sua presença!" },
  { id: "evento", title: "Evento Escolar", text: "Olá! Informamos que o Colégio 21 de Abril realizará o evento [NOME DO EVENTO] no dia [DATA]. Mais detalhes serão enviados em breve!" },
  { id: "geral", title: "Comunicado Geral", text: "Olá! Comunicado do Colégio 21 de Abril: " },
];

const RECIPIENTS = [
  { value: "todos", label: "Todos os pais" },
  ...TURMAS.map(t => ({ value: t, label: t })),
];

export default function Comunicacao() {
  const { sendMessage, messageLogs, contacts } = useApp();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) setMessage(template.text);
  };

  const getAffectedCount = () => {
    if (!recipient) return 0;
    if (recipient === "todos") return contacts.length;
    return contacts.filter(c => c.turma === recipient).length;
  };

  const handleSend = () => {
    if (!message.trim()) {
      toast({ title: "Erro", description: "Digite uma mensagem.", variant: "destructive" });
      return;
    }
    if (!recipient) {
      toast({ title: "Erro", description: "Selecione um destinatário.", variant: "destructive" });
      return;
    }

    const affected = getAffectedCount();
    sendMessage(recipient, message.trim(), selectedTemplate || "manual");

    toast({
      title: "Mensagem registrada",
      description: affected > 0
        ? `Mensagem registrada para ${affected} contato(s) de "${recipient === "todos" ? "todos os pais" : recipient}". Integração com WhatsApp (Stevo.chat) pendente de configuração no backend.`
        : `Mensagem registrada. Nenhum contato cadastrado para esse destinatário.`,
    });

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
            <CardHeader>
              <CardTitle className="text-lg">Enviar Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger><SelectValue placeholder="Escolha um modelo (opcional)" /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger><SelectValue placeholder="Destinatário *" /></SelectTrigger>
                <SelectContent>
                  {RECIPIENTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {recipient && (
                <p className="text-xs text-muted-foreground">
                  {getAffectedCount()} contato(s) cadastrado(s) para este destinatário.
                </p>
              )}

              <Textarea
                placeholder="Digite sua mensagem…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />

              <Button onClick={handleSend} className="w-full">
                <Send className="h-4 w-4 mr-2" /> Registrar envio
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Integração WhatsApp (Stevo.chat) via Supabase Edge Function — configurar API key no backend.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modelos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map(t => (
                <Button
                  key={t.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleTemplateChange(t.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.text.slice(0, 50)}…</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Message log */}
          {messageLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico</CardTitle>
              </CardHeader>
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
