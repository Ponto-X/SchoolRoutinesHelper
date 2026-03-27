

# Sistema de Gestão Escolar — Colégio 21 de Abril

## Identidade Visual Extraída do Site

Baseado no site `colegio21deabril.com.br`:

- **Cores principais**: Vermelho (`#E31E24`), Amarelo/Dourado (`#F5C518` / `#D4A017`), Branco, texto escuro
- **Logo**: Será referenciada diretamente do site — emblema circular com "Colégio 21 de Abril" e o número 21 estilizado
- **Tipografia**: Sans-serif limpa e moderna
- **Estilo geral**: Cores quentes (vermelho + amarelo), visual institucional e acolhedor

## O Que Será Construído

### Estrutura de Páginas
1. **Login** — tela com logo do colégio e cores da escola
2. **Dashboard** — resumo do dia (tarefas, eventos, faltas)
3. **Tarefas/Rotinas** — criar, atribuir e acompanhar tarefas
4. **Agenda de Eventos** — calendário com checklists
5. **Comunicação** — envio de mensagens WhatsApp via API Stevo.chat
6. **Controle de Faltas** — registro e disparo automático de mensagens
7. **Contatos** — cadastro de pais/responsáveis com WhatsApp

### Layout
- Sidebar com logo do colégio no topo, navegação entre módulos
- Header com nome do usuário logado e papel (Diretora, Coordenadora, etc.)
- Cores: vermelho nos elementos de destaque e sidebar, amarelo em botões e destaques, fundo claro

### Backend (Supabase)
- **Tabelas**: users, user_roles, tasks, events, event_checklist_items, students, student_contacts, absences, messages_log
- **Auth**: Login com email/senha
- **Edge Functions**: Integração com API Stevo.chat para envio de WhatsApp
- **RLS**: Políticas por papel do usuário

### Integração WhatsApp (Stevo.chat)
- Edge function que chama a API de envio de mensagem
- API key armazenada como secret no Supabase
- Modelos de mensagem pré-configurados (falta, reunião, evento)

## Etapas de Implementação

1. **Configurar tema visual** — cores, fonte, logo do Colégio 21 de Abril no Tailwind config e CSS
2. **Criar página de Login** com identidade visual da escola
3. **Configurar Supabase** — tabelas, auth, RLS e roles
4. **Criar layout principal** — sidebar + header com navegação
5. **Dashboard** — cards resumo do dia
6. **Módulo de Tarefas** — CRUD, atribuição, status, filtros
7. **Módulo de Eventos** — calendário, checklists vinculadas
8. **Módulo de Contatos** — cadastro de pais/alunos
9. **Módulo de Faltas** — registro por turma, integração com contatos
10. **Módulo de Comunicação** — templates, envio via edge function + Stevo.chat API
11. **Disparo automático de faltas** — ao registrar falta, enviar mensagem ao responsável

