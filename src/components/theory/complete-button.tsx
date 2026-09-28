"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleCompleted, useCompleted } from "./progress-store";

export function CompleteButton({ id }: { id: string }) {
  const done = useCompleted().has(id);
  return (
    <Button
      type="button"
      variant={done ? "secondary" : "default"}
      onClick={() => toggleCompleted(id)}
      aria-pressed={done}
    >
      <Check className="size-4" />
      {done ? "Completed" : "Mark as complete"}
    </Button>
  );
}
