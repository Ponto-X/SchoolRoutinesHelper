import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * PageHeader — padrão profissional mobile + desktop:
 *
 * Mobile  (<640px): título em cima, botão full-width embaixo
 * Desktop (≥640px): título à esquerda, botão à direita — nunca quebra
 *
 * Inspirado em: Linear, Vercel Dashboard, Notion
 */
export function PageHeader({ title, description, action }: Props) {
  return (
    <div>
      {/* Desktop: side by side | Mobile: stack */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {action && (
          /* Mobile: full width | Desktop: auto width */
          <div className="sm:flex-shrink-0 [&>*]:w-full [&>*]:sm:w-auto">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
