import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "atrasada";

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  checklist: ChecklistItem[];
  createdAt: string;
}

export interface Contact {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  turma: string;
  createdAt: string;
}

export interface Absence {
  id: string;
  studentName: string;
  turma: string;
  date: string;
  reason: string;
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface MessageLog {
  id: string;
  recipient: string;
  message: string;
  template: string;
  sentAt: string;
}

export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_TASKS: Task[] = [
  { id: "t1", title: "Preparar painéis da Via Sacra", description: "Montar os painéis para o evento", assignee: "Coord. Ana", status: "pendente", dueDate: "2026-03-27", createdAt: "2026-03-20T08:00:00Z" },
  { id: "t2", title: "Enviar comunicado reunião de pais", description: "Mandar mensagem para os pais do 3º ano", assignee: "Secretaria", status: "em_andamento", dueDate: "2026-03-28", createdAt: "2026-03-20T08:00:00Z" },
  { id: "t3", title: "Revisar roteiro Via Sacra", description: "Revisar o roteiro com a coordenação", assignee: "Coord. Paula", status: "concluida", dueDate: "2026-03-25", createdAt: "2026-03-20T08:00:00Z" },
  { id: "t4", title: "Atender mãe do aluno atípico", description: "Agendar reunião para conversar", assignee: "Coord. Ana", status: "atrasada", dueDate: "2026-03-24", createdAt: "2026-03-20T08:00:00Z" },
];

const SEED_EVENTS: Event[] = [
  { id: "e1", title: "Via Sacra", date: "2026-03-28", checklist: [{ id: "c1", text: "Preparar painéis", done: false }, { id: "c2", text: "Criar roteiro", done: true }, { id: "c3", text: "Comunicar pais", done: false }], createdAt: "2026-03-20T08:00:00Z" },
  { id: "e2", title: "Reunião de Pais - 3º Ano", date: "2026-04-01", checklist: [{ id: "c4", text: "Preparar pauta", done: false }, { id: "c5", text: "Enviar convite", done: false }], createdAt: "2026-03-20T08:00:00Z" },
  { id: "e3", title: "Feira de Ciências", date: "2026-04-10", checklist: [{ id: "c6", text: "Definir projetos", done: false }, { id: "c7", text: "Reservar espaço", done: true }, { id: "c8", text: "Comunicar professores", done: false }], createdAt: "2026-03-20T08:00:00Z" },
];

const SEED_CONTACTS: Contact[] = [
  { id: "ct1", studentName: "João Silva", parentName: "Ana Silva", phone: "5511999990001", turma: "3º Ano A", createdAt: "2026-03-20T08:00:00Z" },
  { id: "ct2", studentName: "Maria Santos", parentName: "Carlos Santos", phone: "5511999990002", turma: "2º Ano B", createdAt: "2026-03-20T08:00:00Z" },
  { id: "ct3", studentName: "Pedro Oliveira", parentName: "Fernanda Oliveira", phone: "5511999990003", turma: "1º Ano A", createdAt: "2026-03-20T08:00:00Z" },
  { id: "ct4", studentName: "Lucas Costa", parentName: "Juliana Costa", phone: "5511999990004", turma: "3º Ano B", createdAt: "2026-03-20T08:00:00Z" },
];

const SEED_ABSENCES: Absence[] = [
  { id: "a1", studentName: "João Silva", turma: "3º Ano A", date: "2026-03-26", reason: "", notified: false, createdAt: "2026-03-26T07:00:00Z" },
  { id: "a2", studentName: "Maria Santos", turma: "2º Ano B", date: "2026-03-26", reason: "Doente", notified: true, notifiedAt: "2026-03-26T08:30:00Z", createdAt: "2026-03-26T07:00:00Z" },
  { id: "a3", studentName: "Pedro Oliveira", turma: "1º Ano A", date: "2026-03-26", reason: "", notified: false, createdAt: "2026-03-26T07:00:00Z" },
];

// ─── Credentials (static users for auth without backend) ─────────────────────

const VALID_USERS: Record<string, { password: string; user: AuthUser }> = {
  "diretora@colegio21.com.br": { password: "admin123", user: { name: "Maria", email: "diretora@colegio21.com.br", role: "Diretora" } },
  "coord.ana@colegio21.com.br": { password: "admin123", user: { name: "Ana", email: "coord.ana@colegio21.com.br", role: "Coordenadora" } },
  "secretaria@colegio21.com.br": { password: "admin123", user: { name: "Paula", email: "secretaria@colegio21.com.br", role: "Secretaria" } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadFromStorage<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : seed;
  } catch {
    return seed;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable – silent fail
  }
}

// ─── Context types ────────────────────────────────────────────────────────────

interface AppContextValue {
  // Auth
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Tasks
  tasks: Task[];
  addTask: (data: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Events
  events: Event[];
  addEvent: (data: Omit<Event, "id" | "createdAt">) => void;
  updateEvent: (id: string, data: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addChecklistItem: (eventId: string, text: string) => void;
  toggleChecklistItem: (eventId: string, itemId: string) => void;
  deleteChecklistItem: (eventId: string, itemId: string) => void;

  // Contacts
  contacts: Contact[];
  addContact: (data: Omit<Contact, "id" | "createdAt">) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  // Absences
  absences: Absence[];
  addAbsence: (data: Omit<Absence, "id" | "createdAt" | "notified">) => void;
  updateAbsence: (id: string, data: Partial<Absence>) => void;
  deleteAbsence: (id: string) => void;
  notifyParent: (id: string) => void;

  // Messages
  messageLogs: MessageLog[];
  sendMessage: (recipient: string, message: string, template: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const s = localStorage.getItem("auth_user");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage("tasks", SEED_TASKS));
  const [events, setEvents] = useState<Event[]>(() => loadFromStorage("events", SEED_EVENTS));
  const [contacts, setContacts] = useState<Contact[]>(() => loadFromStorage("contacts", SEED_CONTACTS));
  const [absences, setAbsences] = useState<Absence[]>(() => loadFromStorage("absences", SEED_ABSENCES));
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>(() => loadFromStorage("message_logs", []));

  // Persist on every change
  useEffect(() => { saveToStorage("tasks", tasks); }, [tasks]);
  useEffect(() => { saveToStorage("events", events); }, [events]);
  useEffect(() => { saveToStorage("contacts", contacts); }, [contacts]);
  useEffect(() => { saveToStorage("absences", absences); }, [absences]);
  useEffect(() => { saveToStorage("message_logs", messageLogs); }, [messageLogs]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const login = useCallback((email: string, password: string): boolean => {
    const entry = VALID_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) return false;
    setUser(entry.user);
    saveToStorage("auth_user", entry.user);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
  }, []);

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback((data: Omit<Task, "id" | "createdAt">) => {
    setTasks(prev => [...prev, { ...data, id: uid(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Events ────────────────────────────────────────────────────────────────

  const addEvent = useCallback((data: Omit<Event, "id" | "createdAt">) => {
    setEvents(prev => [...prev, { ...data, id: uid(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateEvent = useCallback((id: string, data: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const addChecklistItem = useCallback((eventId: string, text: string) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, checklist: [...e.checklist, { id: uid(), text, done: false }] }
        : e
    ));
  }, []);

  const toggleChecklistItem = useCallback((eventId: string, itemId: string) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, checklist: e.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) }
        : e
    ));
  }, []);

  const deleteChecklistItem = useCallback((eventId: string, itemId: string) => {
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, checklist: e.checklist.filter(c => c.id !== itemId) }
        : e
    ));
  }, []);

  // ── Contacts ──────────────────────────────────────────────────────────────

  const addContact = useCallback((data: Omit<Contact, "id" | "createdAt">) => {
    setContacts(prev => [...prev, { ...data, id: uid(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateContact = useCallback((id: string, data: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Absences ──────────────────────────────────────────────────────────────

  const addAbsence = useCallback((data: Omit<Absence, "id" | "createdAt" | "notified">) => {
    setAbsences(prev => [...prev, { ...data, id: uid(), notified: false, createdAt: new Date().toISOString() }]);
  }, []);

  const updateAbsence = useCallback((id: string, data: Partial<Absence>) => {
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAbsence = useCallback((id: string) => {
    setAbsences(prev => prev.filter(a => a.id !== id));
  }, []);

  const notifyParent = useCallback((id: string) => {
    setAbsences(prev => prev.map(a =>
      a.id === id ? { ...a, notified: true, notifiedAt: new Date().toISOString() } : a
    ));
  }, []);

  // ── Messages ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback((recipient: string, message: string, template: string) => {
    const log: MessageLog = {
      id: uid(),
      recipient,
      message,
      template,
      sentAt: new Date().toISOString(),
    };
    setMessageLogs(prev => [log, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      tasks, addTask, updateTask, deleteTask,
      events, addEvent, updateEvent, deleteEvent, addChecklistItem, toggleChecklistItem, deleteChecklistItem,
      contacts, addContact, updateContact, deleteContact,
      absences, addAbsence, updateAbsence, deleteAbsence, notifyParent,
      messageLogs, sendMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
