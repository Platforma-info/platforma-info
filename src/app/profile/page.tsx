import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ProfileRedirectPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(`/u/${session.username}`);
}
