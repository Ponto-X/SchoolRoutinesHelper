// Static fallback — runtime turmas come from DB (tabela turmas)
export const TURMAS_FALLBACK = [
  "1º Ano A", "1º Ano B",
  "2º Ano A", "2º Ano B",
  "3º Ano A", "3º Ano B",
] as const;

export const TURMAS = TURMAS_FALLBACK; // kept for backward compat

export type Turma = string;

export const ROLES = {
  diretora: "Diretora",
  coordenadora: "Coordenadora",
  secretaria: "Secretaria",
  professor: "Professor",
} as const;

export type Role = keyof typeof ROLES;

export const PERMISSIONS: Record<string, string[]> = {
  Diretora:      ["tasks", "events", "contacts", "absences", "comunicacao", "students", "staff", "turmas", "settings"],
  Coordenadora:  ["tasks", "events", "contacts", "absences", "comunicacao", "students", "staff", "turmas"],
  Secretaria:    ["contacts", "absences", "comunicacao", "students"],
  Professor:     ["tasks", "absences", "students"],
};

export function canAccess(role: string | undefined, module: string): boolean {
  if (!role) return false;
  return (PERMISSIONS[role] || []).includes(module);
}
