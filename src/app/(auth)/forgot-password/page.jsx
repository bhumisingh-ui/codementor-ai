"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to send reset link");
        return;
      }

      setMessage(data?.message || "Check your inbox for the reset link.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
          <p className="text-sm text-gray-400 mt-2">We will send a reset link to your email</p>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg bg-[#141414] border border-gray-800 px-3 py-3 text-sm outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] placeholder:text-gray-500"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff9d] text-black font-bold py-3 rounded-lg disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="text-center text-sm mt-4 text-gray-400">
            Back to{" "}
            <Link href="/login" className="text-[#00ff9d] hover:text-cyan-300">
              login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}