"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Numele de utilizator trebuie să aibă minim 3 caractere.")
    .max(24, "Numele de utilizator poate avea maxim 24 de caractere.")
    .regex(/^[a-zA-Z0-9_]+$/, "Doar litere, cifre și underscore sunt permise."),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere."),
});

export type FormState = { error?: string } | null;

export async function registerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  }
  const { username, password } = parsed.data;

  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);
  if (existing.length > 0) {
    return { error: "Numele de utilizator este deja folosit." };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ username, passwordHash })
    .returning({ id: users.id, username: users.username });

  await setSessionCookie({ userId: user.id, username: user.username });
  redirect("/problems");
}

export async function loginAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Nume de utilizator sau parolă incorecte." };
  }
  const { username, password } = parsed.data;

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Nume de utilizator sau parolă incorecte." };
  }

  await setSessionCookie({ userId: user.id, username: user.username });
  redirect("/problems");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function updateBioAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) redirect("/login");

  const bio = z.string().max(280).parse(formData.get("bio") ?? "");
  const db = getDb();
  await db.update(users).set({ bio }).where(eq(users.id, session.userId));
  return { error: undefined };
}
