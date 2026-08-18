import "server-only";
import { Sandbox } from "@vercel/sandbox";

export type JudgeTestCase = {
  input: string;
  expectedOutput: string;
};

export type JudgeVerdict =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "timeout"
  | "compile_error"
  | "internal_error";

export type JudgeResult = {
  verdict: JudgeVerdict;
  testsPassed: number;
  testsTotal: number;
  message: string;
  runtimeMs: number;
};

const PER_TEST_TIMEOUT_MS = 5000;
const SANDBOX_TIMEOUT_MS = 60_000;

export async function judgeSubmission(
  sourceCode: string,
  tests: JudgeTestCase[],
): Promise<JudgeResult> {
  const startedAt = Date.now();

  if (tests.length === 0) {
    return {
      verdict: "internal_error",
      testsPassed: 0,
      testsTotal: 0,
      message: "Problema nu are teste configurate.",
      runtimeMs: 0,
    };
  }

  let sandbox: Sandbox | undefined;
  try {
    sandbox = await Sandbox.create({
      timeout: SANDBOX_TIMEOUT_MS,
      networkPolicy: "deny-all",
      resources: { vcpus: 1 },
    });

    await sandbox.writeFiles([
      { path: "solution.py", content: sourceCode },
    ]);

    const syntaxCheck = await sandbox.runCommand({
      cmd: "python3",
      args: ["-m", "py_compile", "solution.py"],
      timeoutMs: PER_TEST_TIMEOUT_MS,
    });
    if (syntaxCheck.exitCode !== 0) {
      const stderr = await syntaxCheck.stderr();
      return {
        verdict: "compile_error",
        testsPassed: 0,
        testsTotal: tests.length,
        message: truncate(stderr || "Eroare de sintaxă.", 2000),
        runtimeMs: Date.now() - startedAt,
      };
    }

    let passed = 0;
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      await sandbox.writeFiles([{ path: "input.txt", content: test.input }]);

      const run = await sandbox.runCommand({
        cmd: "bash",
        args: ["-c", "python3 solution.py < input.txt"],
        timeoutMs: PER_TEST_TIMEOUT_MS,
      });

      if (run.exitCode === 124 || run.exitCode === 137) {
        return {
          verdict: "timeout",
          testsPassed: passed,
          testsTotal: tests.length,
          message: `Testul ${i + 1} a depășit timpul limită.`,
          runtimeMs: Date.now() - startedAt,
        };
      }

      if (run.exitCode !== 0) {
        const stderr = await run.stderr();
        return {
          verdict: "runtime_error",
          testsPassed: passed,
          testsTotal: tests.length,
          message: `Testul ${i + 1}: ${truncate(stderr || "Eroare la execuție.", 2000)}`,
          runtimeMs: Date.now() - startedAt,
        };
      }

      const stdout = (await run.stdout()).trim();
      const expected = test.expectedOutput.trim();
      if (stdout !== expected) {
        return {
          verdict: "wrong_answer",
          testsPassed: passed,
          testsTotal: tests.length,
          message: `Testul ${i + 1}: rezultat greșit.\nAșteptat: ${truncate(expected, 300)}\nObținut: ${truncate(stdout, 300)}`,
          runtimeMs: Date.now() - startedAt,
        };
      }

      passed++;
    }

    return {
      verdict: "accepted",
      testsPassed: passed,
      testsTotal: tests.length,
      message: "Toate testele au trecut cu succes!",
      runtimeMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      verdict: "internal_error",
      testsPassed: 0,
      testsTotal: tests.length,
      message: err instanceof Error ? err.message : "Eroare internă la evaluare.",
      runtimeMs: Date.now() - startedAt,
    };
  } finally {
    if (sandbox) {
      await sandbox.stop().catch(() => {});
    }
  }
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}
