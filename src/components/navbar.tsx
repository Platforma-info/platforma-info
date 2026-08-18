import Link from "next/link";
import { CodeXml } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/app/actions/auth";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <CodeXml className="size-5 text-primary" />
          <span>PyInfo</span>
        </Link>

        <nav className="flex items-center gap-1">
          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/problems">Probleme</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/u/${session.username}`}>Profil</Link>
              </Button>
              <ThemeToggle />
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Deconectare
                </Button>
              </form>
              <Avatar className="ml-1 size-7">
                <AvatarFallback className="text-xs">
                  {session.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Autentificare</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Creează cont</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
