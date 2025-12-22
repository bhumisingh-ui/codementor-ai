import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let user = null;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      user = {
        id: payload.id,
        username: payload.username || payload.email?.split("@")[0] || "User",
        email: payload.email,
      };
    }
  }

  return <NavbarClient user={user} />;
}

export const dynamic = "force-dynamic";
