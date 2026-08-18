"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/app/actions/auth";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function AuthForm({
  action,
  submitLabel,
  footer,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  footer: ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Nume de utilizator</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="ex: rares08"
          required
          minLength={3}
          maxLength={24}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Parolă</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>
      <SubmitButton label={submitLabel} />
      {footer}
    </form>
  );
}
