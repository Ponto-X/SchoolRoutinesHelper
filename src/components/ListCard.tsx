/**
 * ListCard — componente padrão para todas as listagens do sistema.
 * Garante identidade visual consistente: avatar + nome + badges + detalhes + ações.
 */
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ReactNode } from "react";

interface Detail {
  icon: ReactNode;
  label: string;
  color?: string; // tailwind text color class
}

interface Props {
  /** Letra(s) para o avatar */
  initial: string;
  /** Cor do avatar: "blue" | "green" | "purple" | "orange" | "red" | "emerald" */
  avatarColor?: "blue" | "green" | "purple" | "orange" | "red" | "emerald" | "gray";
  /** Nome principal */
  title: string;
  /** Badge(s) ao lado do título */
  badges?: ReactNode;
  /** Linha de detalhes com ícone + texto */
  details?: Detail[];
  /** Conteúdo extra abaixo dos detalhes (ex: pills de turmas) */
  extra?: ReactNode;
  /** Nota/observação em itálico */
  note?: string;
  /** Inativo = opacidade reduzida */
  inactive?: boolean;
  /** Callbacks */
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

const AVATAR_CLASSES: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-600",
  green:   "bg-green-100 text-green-600",
  purple:  "bg-purple-100 text-purple-600",
  orange:  "bg-orange-100 text-orange-600",
  red:     "bg-red-100 text-red-600",
  emerald: "bg-emerald-100 text-emerald-600",
  gray:    "bg-gray-100 text-gray-600",
};

export function ListCard({
  initial, avatarColor = "blue", title, badges, details = [],
  extra, note, inactive, onEdit, onDelete, canEdit,
}: Props) {
  return (
    <div className={cn(
      "bg-card border rounded-xl transition-all hover:shadow-sm",
      inactive && "opacity-55"
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm",
          AVATAR_CLASSES[avatarColor]
        )}>
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{title}</p>
            {badges}
          </div>

          {details.length > 0 && (
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {details.map((d, i) => (
                <span key={i} className={cn("flex items-center gap-1 text-xs text-muted-foreground", d.color)}>
                  {d.icon}
                  <span className="truncate max-w-[160px]">{d.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-0.5 flex-shrink-0">
            {onEdit && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Extra content (turmas, etc) */}
      {extra && (
        <div className="px-4 pb-3 pt-0 border-t">
          <div className="pt-2">{extra}</div>
        </div>
      )}

      {/* Note */}
      {note && (
        <p className="px-4 pb-2.5 text-xs text-muted-foreground italic">{note}</p>
      )}
    </div>
  );
}
