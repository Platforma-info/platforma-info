import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Autentificare</CardTitle>
          <CardDescription>Intră în contul tău pentru a continua.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            action={loginAction}
            submitLabel="Autentificare"
            footer={
              <p className="text-center text-sm text-muted-foreground">
                Nu ai cont?{" "}
                <Link href="/register" className="text-primary underline underline-offset-4">
                  Creează unul
                </Link>
              </p>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
