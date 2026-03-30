import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { TURMAS, canAccess } from "@/lib/constants";

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

export interface AbsenceSummary {
  studentName: string;
  turma: string;
  total: number;
  absences: Absence[];
}

// ─── Auth users ───────────────────────────────────────────────────────────────

const VALID_USERS: Record<string, { password: string; user: AuthUser }> = {
  "diretora@colegio21.com.br":    { password: "admin123", user: { name: "Maria",  email: "diretora@colegio21.com.br",    role: "Diretora"     } },
  "coord.ana@colegio21.com.br":   { password: "admin123", user: { name: "Ana",    email: "coord.ana@colegio21.com.br",   role: "Coordenadora" } },
  "secretaria@colegio21.com.br":  { password: "admin123", user: { name: "Paula",  email: "secretaria@colegio21.com.br",  role: "Secretaria"   } },
  "prof.carlos@colegio21.com.br": { password: "admin123", user: { name: "Carlos", email: "prof.carlos@colegio21.com.br", role: "Professor"    } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0];
}

/** Mark tasks as "atrasada" if dueDate < today and not concluded */
function applyOverdueStatus(tasks: Task[]): Task[] {
  const t = today();
  return tasks.map(task =>
    task.status !== "concluida" && task.dueDate < t
      ? { ...task, status: "atrasada" as TaskStatus }
      : task
  );
}

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
  canAccess: (module: string) => boolean;

  tasks: Task[];
  loading: boolean;
  addTask: (data: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  events: Event[];
  urgentEvents: Event[];   // events in next 3 days
  addEvent: (data: Omit<Event, "id" | "createdAt">) => Promise<void>;
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addChecklistItem: (eventId: string, text: string) => Promise<void>;
  toggleChecklistItem: (eventId: string, itemId: string) => Promise<void>;
  deleteChecklistItem: (eventId: string, itemId: string) => Promise<void>;

  contacts: Contact[];
  assignees: string[];     // loaded from staff table
  addContact: (data: Omit<Contact, "id" | "createdAt">) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  absences: Absence[];
  absenceSummary: AbsenceSummary[];  // per-student totals
  addAbsence: (data: Omit<Absence, "id" | "createdAt" | "notified">) => Promise<void>;
  updateAbsence: (id: string, data: Partial<Absence>) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  notifyParent: (id: string) => Promise<void>;

  messageLogs: MessageLog[];
  sendMessage: (recipient: string, message: string, template: string) => Promise<void>;
  sendWhatsApp: (phone: string, message: string) => Promise<{ ok: boolean; error?: string }>;
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

  // ── Derived state ────────────────────────────────────────────────────────

  // Events in next 3 days
  const urgentEvents = events.filter(e => {
    const diff = (new Date(e.date).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 3;
  });

  // assignees is now loaded dynamically in Tarefas from staff table
  const assignees: string[] = [];

  // Absence summary per student
  const absenceSummary: AbsenceSummary[] = Object.values(
    absences.reduce((acc, a) => {
      const key = `${a.studentName}__${a.turma}`;
      if (!acc[key]) acc[key] = { studentName: a.studentName, turma: a.turma, total: 0, absences: [] };
      acc[key].total += 1;
      acc[key].absences.push(a);
      return acc;
    }, {} as Record<string, AbsenceSummary>)
  ).sort((a, b) => b.total - a.total);

  // ── Load all data ────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const [tasksRes, eventsRes, itemsRes, contactsRes, absencesRes, logsRes] = await Promise.all([
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("*").order("date", { ascending: true }),
        supabase.from("checklist_items").select("*").order("created_at", { ascending: true }),
        supabase.from("contacts").select("*").order("student_name", { ascending: true }),
        supabase.from("absences").select("*").order("date", { ascending: false }),
        supabase.from("message_logs").select("*").order("sent_at", { ascending: false }),
      ]);

      const rawTasks = (tasksRes.data || []).map(r => mapTask(r as Record<string, unknown>));
      setTasks(applyOverdueStatus(rawTasks));

      const allItems = (itemsRes.data || []).map(r => ({
        ...mapChecklistItem(r as Record<string, unknown>),
        eventId: (r as Record<string, unknown>).event_id as string,
      }));
      setEvents((eventsRes.data || []).map(r => {
        const row = r as Record<string, unknown>;
        const items = allItems.filter(i => i.eventId === row.id).map(({ eventId: _e, ...item }) => item as ChecklistItem);
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

  // Auto-refresh overdue tasks every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => applyOverdueStatus(prev));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

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

  const userCanAccess = useCallback((module: string) => canAccess(user?.role, module), [user]);

  // ── WhatsApp — delegates to lib/whatsapp.ts (supports Evolution, Meta, Stevo) ──

  const sendWhatsApp = useCallback(async (phone: string, message: string) => {
    return sendWhatsAppMessage(phone, message);
  }, []);

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback(async (data: Omit<Task, "id" | "createdAt">) => {
    const supabase = await getSupabase();
    const { data: row } = await supabase.from("tasks").insert({
      title: data.title, description: data.description,
      assignee: data.assignee, status: data.status, due_date: data.dueDate,
    }).select().single();
    if (row) setTasks(prev => applyOverdueStatus([mapTask(row as Record<string, unknown>), ...prev]));
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const supabase = await getSupabase();
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.assignee !== undefined) updates.assignee = data.assignee;
    if (data.status !== undefined) updates.status = data.status;
    if (data.dueDate !== undefined) updates.due_date = data.dueDate;
    await supabase.from("tasks").update(updates).eq("id", id);
    setTasks(prev => applyOverdueStatus(prev.map(t => t.id === id ? { ...t, ...data } : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const supabase = await getSupabase();
    await supabase.from("tasks").delete().eq("id", id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Events ────────────────────────────────────────────────────────────────

  const addEvent = useCallback(async (data: Omit<Event, "id" | "createdAt">) => {
    const supabase = await getSupabase();
    const { data: row } = await supabase.from("events").insert({ title: data.title, date: data.date }).select().single();
    if (row) setEvents(prev => [...prev, mapEvent(row as Record<string, unknown>, [])].sort((a, b) => a.date.localeCompare(b.date)));
  }, []);

  const updateEvent = useCallback(async (id: string, data: Partial<Event>) => {
    const supabase = await getSupabase();
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.date !== undefined) updates.date = data.date;
    await supabase.from("events").update(updates).eq("id", id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const supabase = await getSupabase();
    await supabase.from("events").delete().eq("id", id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const addChecklistItem = useCallback(async (eventId: string, text: string) => {
    const supabase = await getSupabase();
    const { data: row } = await supabase.from("checklist_items").insert({ event_id: eventId, text, done: false }).select().single();
    if (row) {
      const item = mapChecklistItem(row as Record<string, unknown>);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, checklist: [...e.checklist, item] } : e));
    }
  }, []);

  const toggleChecklistItem = useCallback(async (eventId: string, itemId: string) => {
    const supabase = await getSupabase();
    const event = events.find(e => e.id === eventId);
    const item = event?.checklist.find(c => c.id === itemId);
    if (!item) return;
    await supabase.from("checklist_items").update({ done: !item.done }).eq("id", itemId);
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, checklist: e.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) } : e
    ));
  }, [events]);

  const deleteChecklistItem = useCallback(async (eventId: string, itemId: string) => {
    const supabase = await getSupabase();
    await supabase.from("checklist_items").delete().eq("id", itemId);
    setEvents(prev => prev.map(e =>
      e.id === eventId ? { ...e, checklist: e.checklist.filter(c => c.id !== itemId) } : e
    ));
  }, []);

  // ── Contacts ──────────────────────────────────────────────────────────────

  const addContact = useCallback(async (data: Omit<Contact, "id" | "createdAt">) => {
    const supabase = await getSupabase();
    const { data: row } = await supabase.from("contacts").insert({
      student_name: data.studentName, parent_name: data.parentName,
      phone: data.phone, turma: data.turma,
    }).select().single();
    if (row) setContacts(prev => [...prev, mapContact(row as Record<string, unknown>)]);
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>) => {
    const supabase = await getSupabase();
    const updates: Record<string, unknown> = {};
    if (data.studentName !== undefined) updates.student_name = data.studentName;
    if (data.parentName !== undefined) updates.parent_name = data.parentName;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.turma !== undefined) updates.turma = data.turma;
    await supabase.from("contacts").update(updates).eq("id", id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    const supabase = await getSupabase();
    await supabase.from("contacts").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Absences ──────────────────────────────────────────────────────────────

  const addAbsence = useCallback(async (data: Omit<Absence, "id" | "createdAt" | "notified">) => {
    const supabase = await getSupabase();
    const { data: row } = await supabase.from("absences").insert({
      student_name: data.studentName, turma: data.turma,
      date: data.date, reason: data.reason, notified: false,
    }).select().single();
    if (row) setAbsences(prev => [mapAbsence(row as Record<string, unknown>), ...prev]);
  }, []);

  const updateAbsence = useCallback(async (id: string, data: Partial<Absence>) => {
    const supabase = await getSupabase();
    const updates: Record<string, unknown> = {};
    if (data.studentName !== undefined) updates.student_name = data.studentName;
    if (data.turma !== undefined) updates.turma = data.turma;
    if (data.date !== undefined) updates.date = data.date;
    if (data.reason !== undefined) updates.reason = data.reason;
    await supabase.from("absences").update(updates).eq("id", id);
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAbsence = useCallback(async (id: string) => {
    const supabase = await getSupabase();
    await supabase.from("absences").delete().eq("id", id);
    setAbsences(prev => prev.filter(a => a.id !== id));
  }, []);

  const notifyParent = useCallback(async (id: string) => {
    const supabase = await getSupabase();
    const notifiedAt = new Date().toISOString();
    await supabase.from("absences").update({ notified: true, notified_at: notifiedAt }).eq("id", id);
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, notified: true, notifiedAt } : a));
  }, []);

  // ── Messages ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (recipient: string, message: string, template: string) => {
    const supabase = await getSupabase();
    const { data: row } = await supabase.from("message_logs").insert({ recipient, message, template }).select().single();
    if (row) setMessageLogs(prev => [mapMessageLog(row as Record<string, unknown>), ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout, canAccess: userCanAccess, loading,
      tasks, addTask, updateTask, deleteTask,
      events, urgentEvents, addEvent, updateEvent, deleteEvent,
      addChecklistItem, toggleChecklistItem, deleteChecklistItem,
      contacts, assignees, addContact, updateContact, deleteContact,
      absences, absenceSummary, addAbsence, updateAbsence, deleteAbsence, notifyParent,
      messageLogs, sendMessage, sendWhatsApp,
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

export { TURMAS, canAccess as checkAccess };
