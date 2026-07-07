"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getPasswordChecks(password) {
  return [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? "" : "This reset link is missing a token. Request a new password reset link.");
  const [success, setSuccess] = useState("");

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const passwordIsStrong = passwordChecks.every((check) => check.valid);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("This reset link is invalid. Request a new password reset link.");
      return;
    }

    if (!passwordIsStrong) {
      setError("Choose a stronger password before continuing.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "This reset link is invalid, expired, or already used.");
        return;
      }

      setSuccess("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1000);
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
          <h1 className="text-3xl font-bold tracking-tight">Choose a new password</h1>
          <p className="text-sm text-gray-400 mt-2">Reset links expire after 30 minutes and can only be used once.</p>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="New password"
              className="w-full rounded-lg bg-[#141414] border border-gray-800 px-3 py-3 text-sm outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] placeholder:text-gray-500"
            />

            <div className="grid grid-cols-1 gap-1 text-xs text-gray-400">
              {passwordChecks.map((check) => (
                <div key={check.label} className={check.valid ? "text-[#00ff9d]" : "text-gray-500"}>
                  {check.valid ? "+" : "-"} {check.label}
                </div>
              ))}
            </div>

            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="Confirm new password"
              className="w-full rounded-lg bg-[#141414] border border-gray-800 px-3 py-3 text-sm outline-none focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d] placeholder:text-gray-500"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}

            <button
              type="submit"
              disabled={loading || !token || !passwordIsStrong}
              className="w-full bg-[#00ff9d] text-black font-bold py-3 rounded-lg disabled:opacity-70"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
