import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { problems, testCases, submissions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ProblemWorkspace } from "@/components/problem-workspace";

export const dynamic = "force-dynamic";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();

  const [problem] = await db.select().from(problems).where(eq(problems.slug, slug)).limit(1);
  if (!problem) notFound();

  const samples = await db
    .select()
    .from(testCases)
    .where(and(eq(testCases.problemId, problem.id), eq(testCases.isSample, true)))
    .orderBy(testCases.orderIndex);

  const session = await getSession();
  const mySubmissions = session
    ? await db
        .select()
        .from(submissions)
        .where(and(eq(submissions.problemId, problem.id), eq(submissions.userId, session.userId)))
        .orderBy(desc(submissions.createdAt))
        .limit(20)
    : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl flex-1">
        <ProblemWorkspace
          problemSlug={problem.slug}
          statement={problem.statement}
          samples={samples.map((s) => ({ input: s.input, output: s.expectedOutput }))}
          initialSubmissions={mySubmissions}
        />
      </div>
    </div>
  );
}
