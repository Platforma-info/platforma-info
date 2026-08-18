import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Creează cont</CardTitle>
          <CardDescription>Este gratuit și durează mai puțin de un minut.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            action={registerAction}
            submitLabel="Creează cont"
            footer={
              <p className="text-center text-sm text-muted-foreground">
                Ai deja cont?{" "}
                <Link href="/login" className="text-primary underline underline-offset-4">
                  Autentifică-te
                </Link>
              </p>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
