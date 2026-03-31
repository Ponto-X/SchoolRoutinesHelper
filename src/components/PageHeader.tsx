import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">{title}</h1>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
