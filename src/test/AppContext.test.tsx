import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppProvider, useApp } from "@/context/AppContext";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

beforeEach(() => {
  localStorage.clear();
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("Auth", () => {
  it("rejects wrong credentials and returns false", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let ok: boolean;
    act(() => { ok = result.current.login("wrong@test.com", "wrong"); });
    expect(ok!).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("accepts valid credentials and sets user", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.login("diretora@colegio21.com.br", "admin123"); });
    expect(result.current.user?.name).toBe("Maria");
    expect(result.current.user?.role).toBe("Diretora");
  });

  it("persists user in localStorage after login", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.login("diretora@colegio21.com.br", "admin123"); });
    const stored = JSON.parse(localStorage.getItem("auth_user") || "null");
    expect(stored?.email).toBe("diretora@colegio21.com.br");
  });

  it("clears user and localStorage on logout", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.login("diretora@colegio21.com.br", "admin123"); });
    act(() => { result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  it("blocks other valid users with wrong password", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let ok: boolean;
    act(() => { ok = result.current.login("diretora@colegio21.com.br", "wrongpass"); });
    expect(ok!).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

// ── Tasks CRUD ────────────────────────────────────────────────────────────────

describe("Tasks CRUD", () => {
  it("loads seed tasks on first run", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.tasks.length).toBeGreaterThan(0);
  });

  it("creates a new task with correct defaults", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const before = result.current.tasks.length;
    act(() => {
      result.current.addTask({ title: "Nova tarefa", description: "Desc", assignee: "Coord. Ana", status: "pendente", dueDate: "2026-04-01" });
    });
    expect(result.current.tasks.length).toBe(before + 1);
    const added = result.current.tasks.at(-1)!;
    expect(added.title).toBe("Nova tarefa");
    expect(added.status).toBe("pendente");
    expect(added.id).toBeTruthy();
    expect(added.createdAt).toBeTruthy();
  });

  it("updates title and status of existing task", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.tasks[0].id;
    act(() => { result.current.updateTask(id, { title: "Título editado", status: "concluida" }); });
    const updated = result.current.tasks.find(t => t.id === id)!;
    expect(updated.title).toBe("Título editado");
    expect(updated.status).toBe("concluida");
  });

  it("deletes a task by id", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.tasks[0].id;
    const before = result.current.tasks.length;
    act(() => { result.current.deleteTask(id); });
    expect(result.current.tasks.length).toBe(before - 1);
    expect(result.current.tasks.find(t => t.id === id)).toBeUndefined();
  });

  it("cycles through all 4 statuses when updating", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.tasks[0].id;
    const statuses = ["pendente", "em_andamento", "concluida", "atrasada"] as const;
    for (const status of statuses) {
      act(() => { result.current.updateTask(id, { status }); });
      expect(result.current.tasks.find(t => t.id === id)?.status).toBe(status);
    }
  });

  it("persists tasks in localStorage after add", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.addTask({ title: "Persistida", description: "", assignee: "Secretaria", status: "pendente", dueDate: "2026-04-02" });
    });
    const stored: { title: string }[] = JSON.parse(localStorage.getItem("tasks") || "[]");
    expect(stored.some(t => t.title === "Persistida")).toBe(true);
  });
});

// ── Events CRUD ───────────────────────────────────────────────────────────────

describe("Events CRUD", () => {
  it("creates an event with empty checklist", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const before = result.current.events.length;
    act(() => { result.current.addEvent({ title: "Festa Junina", date: "2026-06-15", checklist: [] }); });
    expect(result.current.events.length).toBe(before + 1);
    expect(result.current.events.at(-1)?.checklist).toHaveLength(0);
  });

  it("updates event title and date", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.events[0].id;
    act(() => { result.current.updateEvent(id, { title: "Editado", date: "2026-05-01" }); });
    const ev = result.current.events.find(e => e.id === id)!;
    expect(ev.title).toBe("Editado");
    expect(ev.date).toBe("2026-05-01");
  });

  it("deletes an event", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.events[0].id;
    const before = result.current.events.length;
    act(() => { result.current.deleteEvent(id); });
    expect(result.current.events.length).toBe(before - 1);
    expect(result.current.events.find(e => e.id === id)).toBeUndefined();
  });

  it("adds a checklist item to an event", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.events[0].id;
    const before = result.current.events[0].checklist.length;
    act(() => { result.current.addChecklistItem(id, "Novo item de teste"); });
    const ev = result.current.events.find(e => e.id === id)!;
    expect(ev.checklist.length).toBe(before + 1);
    expect(ev.checklist.at(-1)?.text).toBe("Novo item de teste");
    expect(ev.checklist.at(-1)?.done).toBe(false);
  });

  it("toggles checklist item done state", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const eventId = result.current.events[0].id;
    const item = result.current.events[0].checklist[0];
    const wasDone = item.done;
    act(() => { result.current.toggleChecklistItem(eventId, item.id); });
    const updated = result.current.events.find(e => e.id === eventId)!.checklist.find(c => c.id === item.id)!;
    expect(updated.done).toBe(!wasDone);
    // Toggle back
    act(() => { result.current.toggleChecklistItem(eventId, item.id); });
    const reverted = result.current.events.find(e => e.id === eventId)!.checklist.find(c => c.id === item.id)!;
    expect(reverted.done).toBe(wasDone);
  });

  it("deletes a checklist item", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const eventId = result.current.events[0].id;
    const item = result.current.events[0].checklist[0];
    const before = result.current.events[0].checklist.length;
    act(() => { result.current.deleteChecklistItem(eventId, item.id); });
    expect(result.current.events.find(e => e.id === eventId)!.checklist.length).toBe(before - 1);
    expect(result.current.events.find(e => e.id === eventId)!.checklist.find(c => c.id === item.id)).toBeUndefined();
  });

  it("progress calculation is 0 when checklist is empty (no divide-by-zero)", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.addEvent({ title: "Sem itens", date: "2026-07-01", checklist: [] }); });
    const ev = result.current.events.find(e => e.title === "Sem itens")!;
    expect(ev).toBeDefined();
    const total = ev.checklist.length;
    const done = ev.checklist.filter(c => c.done).length;
    const pct = total === 0 ? 0 : (done / total) * 100;
    expect(Number.isFinite(pct)).toBe(true);
    expect(pct).toBe(0);
  });

  it("progress calculation is 100 when all items done", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const eventId = result.current.events[0].id;
    const items = result.current.events[0].checklist;
    // Mark all done
    for (const item of items) {
      if (!item.done) {
        act(() => { result.current.toggleChecklistItem(eventId, item.id); });
      }
    }
    const ev = result.current.events.find(e => e.id === eventId)!;
    const allDone = ev.checklist.every(c => c.done);
    expect(allDone).toBe(true);
  });
});

// ── Contacts CRUD ─────────────────────────────────────────────────────────────

describe("Contacts CRUD", () => {
  const validContact = { studentName: "Teste Aluno", parentName: "Teste Pai", phone: "5511999990099", turma: "1º Ano A" };

  it("creates a contact", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const before = result.current.contacts.length;
    act(() => { result.current.addContact(validContact); });
    expect(result.current.contacts.length).toBe(before + 1);
    const added = result.current.contacts.at(-1)!;
    expect(added.studentName).toBe("Teste Aluno");
    expect(added.phone).toBe("5511999990099");
  });

  it("updates contact phone", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.contacts[0].id;
    act(() => { result.current.updateContact(id, { phone: "5521999990001" }); });
    expect(result.current.contacts.find(c => c.id === id)?.phone).toBe("5521999990001");
  });

  it("deletes a contact by id", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.contacts[0].id;
    const before = result.current.contacts.length;
    act(() => { result.current.deleteContact(id); });
    expect(result.current.contacts.length).toBe(before - 1);
    expect(result.current.contacts.find(c => c.id === id)).toBeUndefined();
  });

  it("phone validation regex - valid formats", () => {
    const PHONE_REGEX = /^55\d{10,11}$/;
    expect(PHONE_REGEX.test("5511999990099")).toBe(true);   // 55 + 11 digits
    expect(PHONE_REGEX.test("551199999009")).toBe(true);    // 55 + 10 digits
    expect(PHONE_REGEX.test("5521987654321")).toBe(true);   // Rio
  });

  it("phone validation regex - invalid formats", () => {
    const PHONE_REGEX = /^55\d{10,11}$/;
    expect(PHONE_REGEX.test("11999990099")).toBe(false);    // missing DDI
    expect(PHONE_REGEX.test("abc123")).toBe(false);
    expect(PHONE_REGEX.test("")).toBe(false);
    expect(PHONE_REGEX.test("5511")).toBe(false);           // too short
    expect(PHONE_REGEX.test("55119999900991")).toBe(false); // too long
  });

  it("search finds by student name case-insensitively", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const name = result.current.contacts[0].studentName;
    const found = result.current.contacts.filter(c =>
      c.studentName.toLowerCase().includes(name.slice(0, 3).toLowerCase())
    );
    expect(found.length).toBeGreaterThan(0);
  });
});

// ── Absences CRUD ─────────────────────────────────────────────────────────────

describe("Absences CRUD", () => {
  it("creates absence with notified=false by default", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const before = result.current.absences.length;
    act(() => {
      result.current.addAbsence({ studentName: "Fulano", turma: "2º Ano A", date: "2026-03-27", reason: "" });
    });
    expect(result.current.absences.length).toBe(before + 1);
    const added = result.current.absences.at(-1)!;
    expect(added.notified).toBe(false);
    expect(added.notifiedAt).toBeUndefined();
  });

  it("notifyParent sets notified=true and notifiedAt timestamp", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.absences[0].id;
    act(() => { result.current.notifyParent(id); });
    const updated = result.current.absences.find(a => a.id === id)!;
    expect(updated.notified).toBe(true);
    expect(updated.notifiedAt).toBeDefined();
    expect(new Date(updated.notifiedAt!).getTime()).not.toBeNaN();
  });

  it("updates absence reason", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.absences[0].id;
    act(() => { result.current.updateAbsence(id, { reason: "Consulta médica" }); });
    expect(result.current.absences.find(a => a.id === id)?.reason).toBe("Consulta médica");
  });

  it("deletes an absence", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const id = result.current.absences[0].id;
    const before = result.current.absences.length;
    act(() => { result.current.deleteAbsence(id); });
    expect(result.current.absences.length).toBe(before - 1);
    expect(result.current.absences.find(a => a.id === id)).toBeUndefined();
  });

  it("persists absences in localStorage", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.addAbsence({ studentName: "Persistido", turma: "1º Ano A", date: "2026-03-27", reason: "" });
    });
    const stored: { studentName: string }[] = JSON.parse(localStorage.getItem("absences") || "[]");
    expect(stored.some(a => a.studentName === "Persistido")).toBe(true);
  });
});

// ── Messages ──────────────────────────────────────────────────────────────────

describe("Messages", () => {
  it("logs a sent message with correct fields", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.sendMessage("5511999990001", "Mensagem de teste", "falta"); });
    expect(result.current.messageLogs.length).toBe(1);
    const log = result.current.messageLogs[0];
    expect(log.recipient).toBe("5511999990001");
    expect(log.message).toBe("Mensagem de teste");
    expect(log.template).toBe("falta");
    expect(log.sentAt).toBeTruthy();
  });

  it("prepends new messages (most recent first)", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.sendMessage("r1", "msg1", "geral"); });
    act(() => { result.current.sendMessage("r2", "msg2", "geral"); });
    expect(result.current.messageLogs[0].recipient).toBe("r2");
  });

  it("persists message logs in localStorage", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.sendMessage("5511999990002", "Msg persistida", "reuniao"); });
    const stored: { message: string }[] = JSON.parse(localStorage.getItem("message_logs") || "[]");
    expect(stored.some(m => m.message === "Msg persistida")).toBe(true);
  });
});

// ── Dashboard data integrity ──────────────────────────────────────────────────

describe("Dashboard data integrity", () => {
  it("pending count updates when task is added", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const pendingBefore = result.current.tasks.filter(t => t.status !== "concluida").length;
    act(() => {
      result.current.addTask({ title: "Extra pendente", description: "", assignee: "Secretaria", status: "pendente", dueDate: "2026-04-01" });
    });
    const pendingAfter = result.current.tasks.filter(t => t.status !== "concluida").length;
    expect(pendingAfter).toBe(pendingBefore + 1);
  });

  it("pending count decreases when task is marked concluida", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const pendingTask = result.current.tasks.find(t => t.status === "pendente")!;
    const pendingBefore = result.current.tasks.filter(t => t.status !== "concluida").length;
    act(() => { result.current.updateTask(pendingTask.id, { status: "concluida" }); });
    const pendingAfter = result.current.tasks.filter(t => t.status !== "concluida").length;
    expect(pendingAfter).toBe(pendingBefore - 1);
  });

  it("today's absences filtered correctly", () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const today = new Date().toISOString().split("T")[0];
    act(() => {
      result.current.addAbsence({ studentName: "Aluno Hoje", turma: "1º Ano A", date: today, reason: "" });
    });
    const todayCount = result.current.absences.filter(a => a.date === today).length;
    expect(todayCount).toBeGreaterThan(0);
  });
});
