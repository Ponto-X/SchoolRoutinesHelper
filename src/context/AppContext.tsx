import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Auth (static users — swap para Supabase Auth quando necessário) ──────────

const VALID_USERS: Record<string, { password: string; user: AuthUser }> = {
  "diretora@colegio21.com.br": { password: "admin123", user: { name: "Maria", email: "diretora@colegio21.com.br", role: "Diretora" } },
  "coord.ana@colegio21.com.br": { password: "admin123", user: { name: "Ana", email: "coord.ana@colegio21.com.br", role: "Coordenadora" } },
  "secretaria@colegio21.com.br": { password: "admin123", user: { name: "Paula", email: "secretaria@colegio21.com.br", role: "Secretaria" } },
};

// ─── DB row mappers ───────────────────────────────────────────────────────────

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    assignee: row.assignee as string,
    status: row.status as TaskStatus,
    dueDate: row.due_date as string,
    createdAt: row.created_at as string,
  };
}

function mapEvent(row: Record<string, unknown>, items: ChecklistItem[]): Event {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    checklist: items,
    createdAt: row.created_at as string,
  };
}

function mapChecklistItem(row: Record<string, unknown>): ChecklistItem {
  return { id: row.id as string, text: row.text as string, done: row.done as boolean };
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    studentName: row.student_name as string,
    parentName: row.parent_name as string,
    phone: row.phone as string,
    turma: row.turma as string,
    createdAt: row.created_at as string,
  };
}

function mapAbsence(row: Record<string, unknown>): Absence {
  return {
    id: row.id as string,
    studentName: row.student_name as string,
    turma: row.turma as string,
    date: row.date as string,
    reason: (row.reason as string) || "",
    notified: row.notified as boolean,
    notifiedAt: row.notified_at as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapMessageLog(row: Record<string, unknown>): MessageLog {
  return {
    id: row.id as string,
    recipient: row.recipient as string,
    message: row.message as string,
    template: row.template as string,
    sentAt: row.sent_at as string,
  };
}

// ─── Context types ────────────────────────────────────────────────────────────

interface AppContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  tasks: Task[];
  loading: boolean;
  addTask: (data: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  events: Event[];
  addEvent: (data: Omit<Event, "id" | "createdAt">) => Promise<void>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addChecklistItem: (eventId: string, text: string) => Promise<void>;
  toggleChecklistItem: (eventId: string, itemId: string) => Promise<void>;
  deleteChecklistItem: (eventId: string, itemId: string) => Promise<void>;

  contacts: Contact[];
  addContact: (data: Omit<Contact, "id" | "createdAt">) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  absences: Absence[];
  addAbsence: (data: Omit<Absence, "id" | "createdAt" | "notified">) => Promise<void>;
  updateAbsence: (id: string, data: Partial<Absence>) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  notifyParent: (id: string) => Promise<void>;

  messageLogs: MessageLog[];
  sendMessage: (recipient: string, message: string, template: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { const s = localStorage.getItem("auth_user"); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load all data from Supabase ──────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, eventsRes, itemsRes, contactsRes, absencesRes, logsRes] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("*").order("date", { ascending: true }),
        supabase.from("checklist_items").select("*").order("created_at", { ascending: true }),
        supabase.from("contacts").select("*").order("student_name", { ascending: true }),
        supabase.from("absences").select("*").order("date", { ascending: false }),
        supabase.from("message_logs").select("*").order("sent_at", { ascending: false }),
      ]);

      setTasks((tasksRes.data || []).map(r => mapTask(r as Record<string, unknown>)));

      const allItems = (itemsRes.data || []).map(r => ({ ...mapChecklistItem(r as Record<string, unknown>), eventId: (r as Record<string, unknown>).event_id as string }));
      setEvents((eventsRes.data || []).map(r => {
        const row = r as Record<string, unknown>;
        const items = allItems.filter(i => i.eventId === row.id).map(({ ...item }) => item as ChecklistItem);
        return mapEvent(row, items);
      }));

      setContacts((contactsRes.data || []).map(r => mapContact(r as Record<string, unknown>)));
      setAbsences((absencesRes.data || []).map(r => mapAbsence(r as Record<string, unknown>)));
      setMessageLogs((logsRes.data || []).map(r => mapMessageLog(r as Record<string, unknown>)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const login = useCallback((email: string, password: string): boolean => {
    const entry = VALID_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) return false;
    setUser(entry.user);
    localStorage.setItem("auth_user", JSON.stringify(entry.user));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
  }, []);

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback(async (data: Omit<Task, "id" | "createdAt">) => {
    const { data: row } = await supabase.from("tasks").insert({
      title: data.title, description: data.description,
      assignee: data.assignee, status: data.status, due_date: data.dueDate,
    }).select().single();
    if (row) setTasks(prev => [mapTask(row as Record<string, unknown>), ...prev]);
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.assignee !== undefined) updates.assignee = data.assignee;
    if (data.status !== undefined) updates.status = data.status;
    if (data.dueDate !== undefined) updates.due_date = data.dueDate;
    await supabase.from("tasks").update(updates).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Events ────────────────────────────────────────────────────────────────

  const addEvent = useCallback(async (data: Omit<Event, "id" | "createdAt">) => {
    const { data: row } = await supabase.from("events").insert({ title: data.title, date: data.date }).select().single();
    if (row) setEvents(prev => [...prev, mapEvent(row as Record<string, unknown>,[])]);
  }, []);

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.date !== undefined) updates.date = data.date;
    await supabase.from("events").update(updates).eq("id", id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const addChecklistItem = useCallback(async (eventId: string, text: string) => {
    const { data: row } = await supabase.from("checklist_items").insert({ event_id: eventId, text, done: false }).select().single();
    if (row) {
      const item = mapChecklistItem(row as Record<string, unknown>);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, checklist: [...e.checklist, item] } : e));
    }
  }, []);

  const toggleChecklistItem = useCallback(async (eventId: string, itemId: string) => {
    const event = events.find(e => e.id === eventId);
    const item = event?.checklist.find(c => c.id === itemId);
    if (!item) return;
    await supabase.from("checklist_items").update({ done: !item.done }).eq("id", itemId);
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, checklist: e.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) } : e
    ));
  }, [events]);

  const deleteChecklistItem = useCallback(async (eventId: string, itemId: string) => {
    await supabase.from("checklist_items").delete().eq("id", itemId);
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, checklist: e.checklist.filter(c => c.id !== itemId) } : e
    ));
  }, []);

  // ── Contacts ──────────────────────────────────────────────────────────────

  const addContact = useCallback(async (data: Omit<Contact, "id" | "createdAt">) => {
    const { data: row } = await supabase.from("contacts").insert({
      student_name: data.studentName, parent_name: data.parentName,
      phone: data.phone, turma: data.turma,
    }).select().single();
    if (row) setContacts(prev => [...prev, mapContact(row as Record<string, unknown>)]);
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
    const updates: Record<string, unknown> = {};
    if (data.studentName !== undefined) updates.student_name = data.studentName;
    if (data.parentName !== undefined) updates.parent_name = data.parentName;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.turma !== undefined) updates.turma = data.turma;
    await supabase.from("contacts").update(updates).eq("id", id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await supabase.from("contacts").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Absences ──────────────────────────────────────────────────────────────

  const addAbsence = useCallback(async (data: Omit<Absence, "id" | "createdAt" | "notified">) => {
    const { data: row } = await supabase.from("absences").insert({
      student_name: data.studentName, turma: data.turma,
      date: data.date, reason: data.reason, notified: false,
    }).select().single();
    if (row) setAbsences(prev => [mapAbsence(row as Record<string, unknown>), ...prev]);
  }, []);

  const updateAbsence = useCallback(async (id: string, data: Partial<Absence>) => {
    const updates: Record<string, unknown> = {};
    if (data.studentName !== undefined) updates.student_name = data.studentName;
    if (data.turma !== undefined) updates.turma = data.turma;
    if (data.date !== undefined) updates.date = data.date;
    if (data.reason !== undefined) updates.reason = data.reason;
    await supabase.from("absences").update(updates).eq("id", id);
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAbsence = useCallback(async (id: string) => {
    await supabase.from("absences").delete().eq("id", id);
    setAbsences(prev => prev.filter(a => a.id !== id));
  }, []);

  const notifyParent = useCallback(async (id: string) => {
    const notifiedAt = new Date().toISOString();
    await supabase.from("absences").update({ notified: true, notified_at: notifiedAt }).eq("id", id);
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, notified: true, notifiedAt } : a));
  }, []);

  // ── Messages ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (recipient: string, message: string, template: string) => {
    const { data: row } = await supabase.from("message_logs").insert({ recipient, message, template }).select().single();
    if (row) setMessageLogs(prev => [mapMessageLog(row as Record<string, unknown>), ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout, loading,
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
