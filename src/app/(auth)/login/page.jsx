"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const googleError = searchParams.get("google") === "failed" ? "Google sign-in failed. Try again." : "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      // IMPORTANT: full reload so protected routes see the auth cookie
      window.location.href = "/profile";

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-2">Log in to continue</p>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <button
            type="button"
            onClick={() => (window.location.href = "/api/auth/google/start")}
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg bg-[#141414] border px-3 py-3"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg bg-[#141414] border px-3 py-3"
            />

            {(error || googleError) && <p className="text-red-400 text-sm">{error || googleError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff9d] text-black font-bold py-3 rounded-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-right mt-3">
            <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-[#00ff9d] transition">
              Forgot password?
            </Link>
          </div>

          <p className="text-center text-sm mt-4">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-[#00ff9d]">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
