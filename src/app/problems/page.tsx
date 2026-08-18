import Link from "next/link";
import { and, eq, ilike } from "drizzle-orm";
import { CheckCircle2, Search } from "lucide-react";
import { getDb } from "@/db";
import { problems, submissions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const DIFFICULTIES = [
  { value: "", label: "Toate" },
  { value: "easy", label: "Ușor" },
  { value: "medium", label: "Mediu" },
  { value: "hard", label: "Dificil" },
];

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; difficulty?: string }>;
}) {
  const { q = "", difficulty = "" } = await searchParams;
  const session = await getSession();
  const db = getDb();

  const conditions = [];
  if (q.trim()) conditions.push(ilike(problems.title, `%${q.trim()}%`));
  if (difficulty) conditions.push(eq(problems.difficulty, difficulty as "easy" | "medium" | "hard"));

  const allProblems = await db
    .select()
    .from(problems)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(problems.id);

  let solvedIds = new Set<number>();
  if (session) {
    const accepted = await db
      .select({ problemId: submissions.problemId })
      .from(submissions)
      .where(and(eq(submissions.userId, session.userId), eq(submissions.verdict, "accepted")));
    solvedIds = new Set(accepted.map((a) => a.problemId));
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Probleme</h1>
        <p className="text-sm text-muted-foreground">
          {solvedIds.size} din {allProblems.length} rezolvate
        </p>
      </div>

      <form className="mb-6 flex flex-col gap-3 sm:flex-row" action="/problems">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Caută o problemă…" className="pl-8" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {DIFFICULTIES.map((d) => (
            <Button
              key={d.value}
              asChild
              variant={difficulty === d.value ? "default" : "outline"}
              size="sm"
              type="submit"
            >
              <Link
                href={{
                  pathname: "/problems",
                  query: { ...(q ? { q } : {}), ...(d.value ? { difficulty: d.value } : {}) },
                }}
              >
                {d.label}
              </Link>
            </Button>
          ))}
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {allProblems.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nicio problemă găsită.
          </p>
        )}
        {allProblems.map((p) => {
          const solved = solvedIds.has(p.id);
          return (
            <Link key={p.id} href={`/problems/${p.slug}`}>
              <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                <CardContent className="flex items-center justify-between gap-4 py-1">
                  <div className="flex items-center gap-3">
                    {solved ? (
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                    ) : (
                      <div className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/20" />
                    )}
                    <div>
                      <p className="font-medium leading-tight">{p.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DifficultyBadge difficulty={p.difficulty} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
