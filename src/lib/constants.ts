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

export const PERMISSIONS: Record<string, string[]> = {
  Diretora:      ["tasks", "events", "contacts", "absences", "comunicacao", "students", "staff", "settings"],
  Coordenadora:  ["tasks", "events", "contacts", "absences", "comunicacao", "students", "staff"],
  Secretaria:    ["contacts", "absences", "comunicacao", "students"],
  Professor:     ["tasks", "absences", "students"],
};

export function canAccess(role: string | undefined, module: string): boolean {
  if (!role) return false;
  return (PERMISSIONS[role] || []).includes(module);
}
