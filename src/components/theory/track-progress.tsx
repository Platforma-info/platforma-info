"use client";

import { Progress } from "@/components/ui/progress";
import { useCompleted } from "./progress-store";

export function TrackProgress({ ids, showLabel = true }: { ids: string[]; showLabel?: boolean }) {
  const completed = useCompleted();
  const done = ids.filter((id) => completed.has(id)).length;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <Progress value={pct} className="h-1.5 flex-1" aria-label="Track progress" />
      {showLabel && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {done}/{ids.length}
        </span>
      )}
    </div>
  );
}
