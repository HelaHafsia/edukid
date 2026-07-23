import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RedirectionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/connexion");
  }

  const role = (session.user as any).role;
  redirect(role === "ADMIN" ? "/admin" : "/parent");
}
