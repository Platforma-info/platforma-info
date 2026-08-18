"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateBioAction, type FormState } from "@/app/actions/auth";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      Salvează
    </Button>
  );
}

export function BioEditor({ initialBio }: { initialBio: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(updateBioAction, null);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {initialBio || "Nicio descriere adăugată încă."}
        </p>
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label="Editează descrierea">
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setEditing(false);
      }}
      className="flex flex-col gap-2"
    >
      <Textarea
        name="bio"
        defaultValue={initialBio}
        maxLength={280}
        placeholder="Scrie câteva cuvinte despre tine…"
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Anulează
        </Button>
        <SaveButton />
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
