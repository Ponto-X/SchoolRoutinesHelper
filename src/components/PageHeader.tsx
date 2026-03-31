import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * PageHeader — padrão mobile-first para todas as telas.
 * Mobile: título em cima, botão abaixo (sem truncar)
 * Desktop: título e botão lado a lado
 */
export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 pt-0.5">{action}</div>
        )}
      </div>
    </div>
  );
}
