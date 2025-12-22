import { NextResponse } from "next/server";


export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set secure flag in production
    sameSite: "strict",    // CSRF protection
    maxAge: 0,     // Expire the cookie immediately
    path: "/",     // Make cookie available site-wide
  });
  return res;
}
