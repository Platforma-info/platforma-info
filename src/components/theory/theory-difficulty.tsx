import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TheoryDifficulty } from "@/lib/theory/content";

const STYLES: Record<TheoryDifficulty, string> = {
  beginner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  intermediate: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  advanced: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const LABELS: Record<TheoryDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function TheoryDifficultyBadge({ difficulty }: { difficulty: TheoryDifficulty }) {
  return (
    <Badge variant="outline" className={cn(STYLES[difficulty])}>
      {LABELS[difficulty]}
    </Badge>
  );
}
