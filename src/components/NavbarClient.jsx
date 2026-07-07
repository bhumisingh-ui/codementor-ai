"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function Avatar({ name }) {
  const initials = (name || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#00ff9d] text-black font-bold flex items-center justify-center">
      {initials}
    </div>
  );
}

export default function NavbarClient({ user }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/protected", {
          credentials: "include",
          cache: "no-store",
        });

        if (!mounted) return;

        if (!res.ok) {
          setCurrentUser(null);
          return;
        }

        const data = await res.json();
        const authUser = data?.user;
        setCurrentUser(
          authUser
            ? {
                id: authUser.id,
                username: authUser.username || authUser.email?.split("@")[0] || "User",
                email: authUser.email,
              }
            : null
        );
      } catch {
        if (mounted) setCurrentUser(null);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setCurrentUser(null);
      setOpen(false);
      window.location.href = "/";
    } catch {
      // noop
    }
  }

  return (
    <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <span>
            CodeMentor<span className="text-[#00ff9d]">.AI</span>
          </span>
        </Link>

        {!currentUser ? (
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition">
              Log In
            </Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-bold bg-[#00ff9d] text-black rounded-md hover:bg-[#00ff9d]/90 transition shadow-[0_0_15px_rgba(0,255,157,0.4)]">
              Get Started
            </Link>
          </div>
        ) : (
          <div className="relative">
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3">
              <Avatar name={currentUser.username} />
              <span className="text-sm text-gray-300">{currentUser.username}</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border border-white/10 bg-[#0A0A0A] shadow-lg">
                <Link href="/profile" className="block px-3 py-2 text-sm text-gray-300 hover:text-[#00ff9d] hover:bg-white/5">
                  See Profile
                </Link>
                <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-[#00ff9d] hover:bg-white/5">
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
