import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, Timer, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/problems");

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          Evaluare automată în sandbox izolat
        </div>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Rezolvă probleme de programare. Primește verdict instant.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          PyInfo este locul unde exersezi algoritmi în Python, îți vezi
          istoricul de trimiteri și progresul, într-un mediu sigur și rapid.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/register">
              Creează cont gratuit <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Am deja cont</Link>
          </Button>
        </div>

        <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-start gap-2 pt-2">
              <Timer className="size-5 text-primary" />
              <h3 className="font-medium">Feedback instant</h3>
              <p className="text-sm text-muted-foreground">
                Codul tău rulează imediat împotriva seturilor de teste, cu
                rezultat detaliat pentru fiecare caz.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-start gap-2 pt-2">
              <ShieldCheck className="size-5 text-primary" />
              <h3 className="font-medium">Execuție izolată</h3>
              <p className="text-sm text-muted-foreground">
                Fiecare trimitere rulează într-un mediu sandbox efemer, fără
                acces la rețea sau la alte trimiteri.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-start gap-2 pt-2">
              <Sparkles className="size-5 text-primary" />
              <h3 className="font-medium">Progres urmărit</h3>
              <p className="text-sm text-muted-foreground">
                Profilul tău arată problemele rezolvate, rata de reușită și
                istoricul complet al trimiterilor.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
