"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      } else {
        // Force a full reload so server navbar sees fresh cookies
        window.location.href = "/";
      }
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

        <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-[0_0_30px_rgba(0,255,157,0.05)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg bg-[#141414] border border-gray-800 px-3 py-3 text-sm outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] placeholder:text-gray-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg bg-[#141414] border border-gray-800 px-3 py-3 text-sm outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] placeholder:text-gray-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#00ff9d] text-black font-bold py-3 hover:bg-[#00ff9d]/90 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,157,0.35)]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-[#00ff9d] hover:text-cyan-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
