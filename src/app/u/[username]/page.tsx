import { notFound } from "next/navigation";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { CalendarDays, CheckCircle2, ListChecks, Target } from "lucide-react";
import { getDb } from "@/db";
import { users, submissions, problems } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { VerdictBadge } from "@/components/verdict-badge";
import { BioEditor } from "@/components/bio-editor";
import { formatDistanceToNow } from "@/lib/format-time";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = getDb();

  const [profileUser] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);
  if (!profileUser) notFound();

  const session = await getSession();
  const isOwnProfile = session?.userId === profileUser.id;

  const [allSubs, recentSubs, [{ totalProblems }]] = await Promise.all([
    db
      .select({ id: submissions.id, problemId: submissions.problemId, verdict: submissions.verdict })
      .from(submissions)
      .where(eq(submissions.userId, profileUser.id)),
    db
      .select({
        id: submissions.id,
        verdict: submissions.verdict,
        testsPassed: submissions.testsPassed,
        testsTotal: submissions.testsTotal,
        createdAt: submissions.createdAt,
        problemTitle: problems.title,
        problemSlug: problems.slug,
      })
      .from(submissions)
      .innerJoin(problems, eq(submissions.problemId, problems.id))
      .where(eq(submissions.userId, profileUser.id))
      .orderBy(desc(submissions.createdAt))
      .limit(20),
    db.select({ totalProblems: sql<number>`count(*)::int` }).from(problems),
  ]);

  const solvedIds = new Set(allSubs.filter((s) => s.verdict === "accepted").map((s) => s.problemId));
  const totalSubmissions = allSubs.length;
  const acceptedSubmissions = allSubs.filter((s) => s.verdict === "accepted").length;
  const acceptanceRate = totalSubmissions === 0 ? 0 : Math.round((acceptedSubmissions / totalSubmissions) * 100);
  const solveProgress = totalProblems === 0 ? 0 : Math.round((solvedIds.size / totalProblems) * 100);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-start gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-xl">
            {profileUser.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{profileUser.username}</h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              Membru din {new Date(profileUser.createdAt).toLocaleDateString("ro-RO", { year: "numeric", month: "long" })}
            </p>
          </div>
          {isOwnProfile ? (
            <BioEditor initialBio={profileUser.bio} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {profileUser.bio || "Nicio descriere adăugată încă."}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 pt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4" />
              <span className="text-xs">Probleme rezolvate</span>
            </div>
            <p className="text-2xl font-semibold">
              {solvedIds.size}
              <span className="text-sm font-normal text-muted-foreground"> / {totalProblems}</span>
            </p>
            <Progress value={solveProgress} className="h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ListChecks className="size-4" />
              <span className="text-xs">Trimiteri totale</span>
            </div>
            <p className="text-2xl font-semibold">{totalSubmissions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 pt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="size-4" />
              <span className="text-xs">Rată de reușită</span>
            </div>
            <p className="text-2xl font-semibold">{acceptanceRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Activitate recentă</h2>
        {recentSubs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nicio trimitere încă.
          </p>
        )}
        {recentSubs.map((s) => (
          <Link key={s.id} href={`/problems/${s.problemSlug}`}>
            <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardContent className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3">
                  <VerdictBadge verdict={s.verdict} />
                  <span className="text-sm font-medium">{s.problemTitle}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.testsPassed}/{s.testsTotal} teste
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(s.createdAt)}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
