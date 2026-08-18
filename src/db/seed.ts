import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { problems, testCases } from "./schema";

type SeedProblem = {
  slug: string;
  title: string;
  statement: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  tests: { input: string; output: string; isSample?: boolean }[];
};

const seedProblems: SeedProblem[] = [
  {
    slug: "nume-inversat",
    title: "Nume inversat",
    statement:
      "Scrieți un program care citește un nume de pe prima linie a intrării standard și afișează numele inversat.",
    difficulty: "easy",
    tags: ["stringuri"],
    tests: [
      { input: "Ana", output: "anA", isSample: true },
      { input: "Rares", output: "seraR" },
      { input: "Popescu", output: "ucsepoP" },
    ],
  },
  {
    slug: "suma-a-doua-numere",
    title: "Suma a două numere",
    statement:
      "Citiți două numere întregi separate prin spațiu de pe prima linie și afișați suma lor.",
    difficulty: "easy",
    tags: ["matematica"],
    tests: [
      { input: "5 7", output: "12", isSample: true },
      { input: "-3 10", output: "7" },
      { input: "0 0", output: "0" },
    ],
  },
  {
    slug: "par-sau-impar",
    title: "Par sau impar",
    statement:
      "Citiți un număr întreg și afișați 'par' dacă este par, sau 'impar' dacă este impar.",
    difficulty: "easy",
    tags: ["matematica"],
    tests: [
      { input: "4", output: "par", isSample: true },
      { input: "7", output: "impar" },
      { input: "0", output: "par" },
    ],
  },
  {
    slug: "suma-cifrelor",
    title: "Suma cifrelor unui număr",
    statement: "Citiți un număr întreg pozitiv și afișați suma cifrelor sale.",
    difficulty: "easy",
    tags: ["matematica"],
    tests: [
      { input: "123", output: "6", isSample: true },
      { input: "9999", output: "36" },
      { input: "10", output: "1" },
    ],
  },
  {
    slug: "factorial",
    title: "Factorial",
    statement: "Citiți un număr întreg n (0 ≤ n ≤ 15) și afișați valoarea lui n!.",
    difficulty: "easy",
    tags: ["matematica", "recursivitate"],
    tests: [
      { input: "5", output: "120", isSample: true },
      { input: "0", output: "1" },
      { input: "10", output: "3628800" },
    ],
  },
  {
    slug: "palindrom",
    title: "Palindrom",
    statement:
      "Citiți un cuvânt și afișați 'Palindrom' dacă se citește la fel din ambele direcții, altfel 'Nu e palindrom'.",
    difficulty: "easy",
    tags: ["stringuri"],
    tests: [
      { input: "radar", output: "Palindrom", isSample: true },
      { input: "gigel", output: "Nu e palindrom" },
      { input: "capac", output: "Palindrom" },
    ],
  },
  {
    slug: "maxim-lista",
    title: "Cel mai mare număr dintr-o listă",
    statement:
      "Citiți pe o linie o listă de numere întregi separate prin spațiu și afișați cea mai mare valoare.",
    difficulty: "easy",
    tags: ["vectori"],
    tests: [
      { input: "3 5 1 7", output: "7", isSample: true },
      { input: "-1 -5 -2", output: "-1" },
      { input: "42", output: "42" },
    ],
  },
  {
    slug: "inversare-lista",
    title: "Inversarea unei liste",
    statement:
      "Citiți pe o linie o listă de numere separate prin spațiu și afișați-o inversată, cu elementele separate prin ', '.",
    difficulty: "easy",
    tags: ["vectori"],
    tests: [
      { input: "1 2 3", output: "3, 2, 1", isSample: true },
      { input: "4 5 6 7", output: "7, 6, 5, 4" },
    ],
  },
  {
    slug: "numar-prim",
    title: "Verificare număr prim",
    statement:
      "Citiți un număr întreg și afișați 'Prim' dacă este prim, altfel 'Neprim'.",
    difficulty: "medium",
    tags: ["matematica"],
    tests: [
      { input: "13", output: "Prim", isSample: true },
      { input: "1", output: "Neprim" },
      { input: "97", output: "Prim" },
      { input: "100", output: "Neprim" },
    ],
  },
  {
    slug: "medie-aritmetica",
    title: "Media aritmetică",
    statement:
      "Citiți pe o linie o listă de numere separate prin spațiu și afișați media lor aritmetică (fără zecimale dacă rezultatul e întreg).",
    difficulty: "easy",
    tags: ["vectori", "matematica"],
    tests: [
      { input: "4 8 6", output: "6.0", isSample: true },
      { input: "1 2 3 4", output: "2.5" },
    ],
  },
  {
    slug: "celsius-fahrenheit",
    title: "Celsius în Fahrenheit",
    statement:
      "Citiți o temperatură în grade Celsius și afișați echivalentul în grade Fahrenheit (F = C * 9/5 + 32), fără zecimale.",
    difficulty: "easy",
    tags: ["matematica"],
    tests: [
      { input: "0", output: "32", isSample: true },
      { input: "100", output: "212" },
      { input: "-40", output: "-40" },
    ],
  },
  {
    slug: "numarare-vocale",
    title: "Numărarea vocalelor",
    statement:
      "Citiți un text de pe o linie și afișați câte vocale (a, e, i, o, u) conține, ignorând majuscule/minuscule.",
    difficulty: "easy",
    tags: ["stringuri"],
    tests: [
      { input: "Hello World", output: "3", isSample: true },
      { input: "AEIOU", output: "5" },
      { input: "xyz", output: "0" },
    ],
  },
  {
    slug: "suma-numere-impare",
    title: "Suma numerelor impare",
    statement:
      "Citiți pe o linie o listă de numere separate prin spațiu și afișați suma numerelor impare din listă.",
    difficulty: "easy",
    tags: ["vectori"],
    tests: [
      { input: "1 2 3 4 5", output: "9", isSample: true },
      { input: "2 4 6", output: "0" },
    ],
  },
  {
    slug: "litera-frecventa",
    title: "Cea mai frecventă literă",
    statement:
      "Citiți un text format doar din litere mici și afișați litera care apare cel mai frecvent (dacă sunt egalități, afișați prima în ordine alfabetică).",
    difficulty: "medium",
    tags: ["stringuri"],
    tests: [
      { input: "abracadabra", output: "a", isSample: true },
      { input: "aabbbcc", output: "b" },
    ],
  },
];

async function main() {
  const db = getDb();
  console.log("Seeding problems...");
  for (const p of seedProblems) {
    const [row] = await db
      .insert(problems)
      .values({
        slug: p.slug,
        title: p.title,
        statement: p.statement,
        difficulty: p.difficulty,
        tags: p.tags,
      })
      .onConflictDoUpdate({
        target: problems.slug,
        set: {
          title: p.title,
          statement: p.statement,
          difficulty: p.difficulty,
          tags: p.tags,
        },
      })
      .returning({ id: problems.id });

    // Remove existing test cases for this problem, then re-insert.
    await db.delete(testCases).where(eq(testCases.problemId, row.id));
    await db.insert(testCases).values(
      p.tests.map((t, i) => ({
        problemId: row.id,
        input: t.input,
        expectedOutput: t.output,
        isSample: t.isSample ?? false,
        orderIndex: i,
      })),
    );
    console.log(`  seeded: ${p.slug}`);
  }
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
