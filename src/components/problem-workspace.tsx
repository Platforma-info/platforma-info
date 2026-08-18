"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Loader2, Play, Terminal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { VerdictBadge } from "@/components/verdict-badge";
import { submitSolutionAction, type SubmitState } from "@/app/actions/submit";
import { formatDistanceToNow } from "@/lib/format-time";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Se încarcă editorul…
    </div>
  ),
});

const DEFAULT_TEMPLATE = "# Scrie soluția ta aici\n";

type Submission = {
  id: number;
  verdict: string;
  testsPassed: number;
  testsTotal: number;
  message: string;
  createdAt: Date;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      {pending ? "Se evaluează…" : "Trimite soluția"}
    </Button>
  );
}

export function ProblemWorkspace({
  problemSlug,
  statement,
  samples,
  initialSubmissions,
}: {
  problemSlug: string;
  statement: string;
  samples: { input: string; output: string }[];
  initialSubmissions: Submission[];
}) {
  const { resolvedTheme } = useTheme();
  const [code, setCode] = useState(DEFAULT_TEMPLATE);
  const [state, formAction] = useActionState<SubmitState, FormData>(
    submitSolutionAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4 overflow-y-auto lg:max-h-[calc(100vh-4.5rem)]">
        <Tabs defaultValue="statement">
          <TabsList>
            <TabsTrigger value="statement">Enunț</TabsTrigger>
            <TabsTrigger value="submissions">
              Trimiterile mele {initialSubmissions.length > 0 && `(${initialSubmissions.length})`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="statement" className="flex flex-col gap-4">
            <p className="whitespace-pre-wrap leading-relaxed">{statement}</p>
            {samples.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">Exemple</h3>
                {samples.map((s, i) => (
                  <Card key={i}>
                    <CardContent className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                      <div>
                        <p className="mb-1 text-muted-foreground">Input</p>
                        <pre className="whitespace-pre-wrap rounded bg-muted p-2">{s.input || "(fără input)"}</pre>
                      </div>
                      <div>
                        <p className="mb-1 text-muted-foreground">Output așteptat</p>
                        <pre className="whitespace-pre-wrap rounded bg-muted p-2">{s.output}</pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="submissions" className="flex flex-col gap-2">
            {initialSubmissions.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nu ai nicio trimitere pentru această problemă încă.
              </p>
            )}
            {initialSubmissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <VerdictBadge verdict={s.verdict as never} />
                    <span className="text-xs text-muted-foreground">
                      {s.testsPassed}/{s.testsTotal} teste
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(s.createdAt)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-3 lg:sticky lg:top-[4.5rem] lg:self-start"
      >
        <input type="hidden" name="problemSlug" value={problemSlug} />
        <textarea name="sourceCode" value={code} className="sr-only" tabIndex={-1} readOnly />

        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <Terminal className="size-3.5" />
            solution.py
          </div>
          <MonacoEditor
            height="420px"
            language="python"
            theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              padding: { top: 12 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {state?.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state?.result && (
          <Card>
            <CardContent className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <VerdictBadge verdict={state.result.verdict} />
                <span className="text-sm text-muted-foreground">
                  {state.result.testsPassed}/{state.result.testsTotal} teste trecute
                </span>
              </div>
              {state.result.message && (
                <pre className="whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                  {state.result.message}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
