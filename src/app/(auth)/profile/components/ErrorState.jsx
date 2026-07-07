"use client";

import { AlertOctagon, RefreshCw } from "lucide-react";

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md mt-8">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <AlertOctagon className="w-8 h-8 text-red-400" />
      </div>
      
      <h2 className="text-xl font-bold text-white mb-2">Failed to load profile data</h2>
      <p className="text-gray-400 max-w-md mb-6 text-sm">
        {error || "An unexpected error occurred while fetching your data. Please try again."}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  );
}
