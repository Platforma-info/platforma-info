"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { problems, testCases, submissions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { judgeSubmission, type JudgeVerdict } from "@/lib/judge";

export type SubmitState = {
  error?: string;
  result?: {
    verdict: JudgeVerdict;
    testsPassed: number;
    testsTotal: number;
    message: string;
  };
} | null;

const submitSchema = z.object({
  problemSlug: z.string().min(1),
  sourceCode: z.string().trim().min(1, "Soluția nu poate fi goală."),
});

export async function submitSolutionAction(
  _prevState: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const session = await getSession();
  if (!session) {
    return { error: "Trebuie să fii autentificat pentru a trimite o soluție." };
  }

  const parsed = submitSchema.safeParse({
    problemSlug: formData.get("problemSlug"),
    sourceCode: formData.get("sourceCode"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  }

  const db = getDb();
  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.slug, parsed.data.problemSlug))
    .limit(1);
  if (!problem) {
    return { error: "Problema nu există." };
  }

  const tests = await db
    .select()
    .from(testCases)
    .where(eq(testCases.problemId, problem.id))
    .orderBy(testCases.orderIndex);

  const judged = await judgeSubmission(
    parsed.data.sourceCode,
    tests.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
  );

  await db.insert(submissions).values({
    userId: session.userId,
    problemId: problem.id,
    sourceCode: parsed.data.sourceCode,
    verdict: judged.verdict,
    testsPassed: judged.testsPassed,
    testsTotal: judged.testsTotal,
    message: judged.message,
    runtimeMs: judged.runtimeMs,
  });

  revalidatePath(`/problems/${problem.slug}`);
  revalidatePath(`/u/${session.username}`);
  revalidatePath("/problems");

  return {
    result: {
      verdict: judged.verdict,
      testsPassed: judged.testsPassed,
      testsTotal: judged.testsTotal,
      message: judged.message,
    },
  };
}
