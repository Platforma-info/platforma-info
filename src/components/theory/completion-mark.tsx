"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useCompleted } from "./progress-store";

export function CompletionMark({ id }: { id: string }) {
  const done = useCompleted().has(id);
  return done ? (
    <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-label="Completed" />
  ) : (
    <Circle className="size-4 shrink-0 text-muted-foreground/30" aria-hidden />
  );
}
