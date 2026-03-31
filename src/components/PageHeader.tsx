import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * PageHeader — UI Engineering Decision:
 *
 * Mobile (<640px):
 *   - Título ocupa 100% da largura — nunca compete com botão
 *   - Botão abaixo em largura total — fácil de tocar (44px+ touch target)
 *   - Descrição discreta entre título e botão
 *
 * Desktop (≥640px):
 *   - Título + descrição à esquerda, botão à direita na mesma linha
 *   - Alinhamento pelo baseline inferior do bloco de texto
 *   - Padrão Linear, Vercel, Notion, GitHub
 */
export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      {/* Left: title + description */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Action: full width on mobile, auto on desktop */}
      {action && (
        <div className="w-full sm:w-auto flex-shrink-0">
          <div className="[&>button]:w-full sm:[&>button]:w-auto
                          [&>a>button]:w-full sm:[&>a>button]:w-auto">
            {action}
          </div>
        </div>
      )}
    </div>
  );
}
