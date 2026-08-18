import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  easy: "Ușor",
  medium: "Mediu",
  hard: "Dificil",
};

const STYLES: Record<string, string> = {
  easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  hard: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <Badge variant="outline" className={cn(STYLES[difficulty])}>
      {LABELS[difficulty] ?? difficulty}
    </Badge>
  );
}
