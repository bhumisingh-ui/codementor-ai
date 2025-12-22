import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function StartAnalysis() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // If user has a valid token, go to editor; otherwise, go to signup
  const payload = token ? verifyToken(token) : null;
  if (payload?.id) {
    redirect("/editor");
  }
  redirect("/signup");
}

export const dynamic = "force-dynamic";
