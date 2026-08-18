import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JudgeVerdict } from "@/lib/judge";

const LABELS: Record<JudgeVerdict | "pending", string> = {
  pending: "În așteptare",
  accepted: "Acceptat",
  wrong_answer: "Răspuns greșit",
  runtime_error: "Eroare de execuție",
  timeout: "Timp depășit",
  compile_error: "Eroare de sintaxă",
  internal_error: "Eroare internă",
};

const STYLES: Record<JudgeVerdict | "pending", string> = {
  pending: "border-muted-foreground/30 bg-muted text-muted-foreground",
  accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  wrong_answer: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  runtime_error: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  timeout: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  compile_error: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  internal_error: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function VerdictBadge({ verdict }: { verdict: JudgeVerdict | "pending" }) {
  return (
    <Badge variant="outline" className={cn(STYLES[verdict])}>
      {LABELS[verdict] ?? verdict}
    </Badge>
  );
}
