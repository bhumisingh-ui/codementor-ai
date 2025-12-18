"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505]">
      {/* The Spinner - Styles are pulled from app/globals.css */}
      <div className="orbit-spinner"></div>
      
      {/* Text to confirm it's rendering */}
      <h2 className="mt-8 text-[#00ff9d] font-mono animate-pulse tracking-widest">
        SYSTEM_LOADING...
      </h2>
    </div>
  );
}