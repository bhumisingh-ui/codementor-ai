import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { applyAuthCookie, signAuthToken } from "@/lib/auth";

async function fetchGoogleProfile(code) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("Google token exchange failed");
  }

  const tokenData = await tokenRes.json();
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error("Google profile fetch failed");
  }

  return profileRes.json();
}

async function makeUniqueUsername(email, displayName) {
  const base = (displayName || email.split("@")[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";

  let candidate = base;
  let suffix = 1;

  while (await User.findOne({ username: candidate })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const expectedState = req.cookies.get("google_oauth_state")?.value;

    if (error || !code || !state || state !== expectedState) {
      return NextResponse.redirect(new URL("/login?google=failed", req.url));
    }

    const profile = await fetchGoogleProfile(code);
    if (!profile?.email || !profile?.id) {
      return NextResponse.redirect(new URL("/login?google=failed", req.url));
    }

    await connectDB();

    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.email.toLowerCase() });
    }

    if (!user) {
      // New Google users get a short, unique username so the existing UI keeps working.
      user = await User.create({
        username: await makeUniqueUsername(profile.email, profile.name),
        email: profile.email.toLowerCase(),
        provider: "google",
        googleId: profile.id,
        emailVerified: true,
      });
    } else {
      user.googleId = profile.id;
      user.provider = "google";
      user.emailVerified = true;
      await user.save();
    }

    const response = NextResponse.redirect(new URL("/profile", req.url));
    response.cookies.delete("google_oauth_state");
    return applyAuthCookie(response, signAuthToken(user));
  } catch (err) {
    console.error("GOOGLE CALLBACK ERROR:", err);
    return NextResponse.redirect(new URL("/login?google=failed", req.url));
  }
}