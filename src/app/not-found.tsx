import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <CompassIcon className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">Pagina nu există</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Link-ul pe care l-ai accesat nu corespunde niciunei pagini din platforma-info.
      </p>
      <Button asChild>
        <Link href="/problems">Înapoi la probleme</Link>
      </Button>
    </div>
  );
}
