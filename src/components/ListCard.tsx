import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ReactNode } from "react";

interface Detail {
  icon: ReactNode;
  label: string;
}

interface Props {
  initial: string;
  avatarColor?: "blue" | "green" | "purple" | "orange" | "red" | "emerald" | "gray";
  title: string;
  badges?: ReactNode;
  details?: Detail[];
  extra?: ReactNode;
  note?: string;
  inactive?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

const AVATAR: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-600",
  green:   "bg-green-100 text-green-600",
  purple:  "bg-purple-100 text-purple-600",
  orange:  "bg-orange-100 text-orange-600",
  red:     "bg-red-100 text-red-600",
  emerald: "bg-emerald-100 text-emerald-600",
  gray:    "bg-gray-100 text-gray-500",
};

export function ListCard({ initial, avatarColor = "blue", title, badges, details = [], extra, note, inactive, onEdit, onDelete, canEdit }: Props) {
  return (
    <div className={cn("bg-card border rounded-xl transition-shadow hover:shadow-sm", inactive && "opacity-55")}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm", AVATAR[avatarColor])}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{title}</p>
            {badges}
          </div>
          {details.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {details.map((d, i) => (
                <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                  {d.icon}<span className="truncate max-w-[140px]">{d.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-0.5 flex-shrink-0">
            {onEdit && <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>}
            {onDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>}
          </div>
        )}
      </div>
      {(extra || note) && (
        <div className="px-4 pb-3 border-t pt-2 space-y-1">
          {extra}
          {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
        </div>
      )}
    </div>
  );
}
