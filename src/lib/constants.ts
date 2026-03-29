// Centralized constants — source of truth for the whole app
// These will move to DB settings table in a future iteration

export const TURMAS = [
  "1º Ano A", "1º Ano B",
  "2º Ano A", "2º Ano B",
  "3º Ano A", "3º Ano B",
] as const;

export type Turma = typeof TURMAS[number];

export const ROLES = {
  diretora: "Diretora",
  coordenadora: "Coordenadora",
  secretaria: "Secretaria",
  professor: "Professor",
} as const;

export type Role = keyof typeof ROLES;

// Role permissions
export const PERMISSIONS: Record<string, string[]> = {
  Diretora:      ["tasks", "events", "contacts", "absences", "comunicacao", "settings"],
  Coordenadora:  ["tasks", "events", "contacts", "absences", "comunicacao"],
  Secretaria:    ["contacts", "absences", "comunicacao"],
  Professor:     ["tasks", "absences"],
};

export function canAccess(role: string | undefined, module: string): boolean {
  if (!role) return false;
  return (PERMISSIONS[role] || []).includes(module);
}
