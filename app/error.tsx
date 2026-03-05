"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
      <div className="bento-card rounded-xl p-8 max-w-md w-full mx-6">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.2em] text-danger mb-4">
          Something went wrong
        </h2>
        <p className="text-[13px] text-text-muted mb-6 leading-relaxed">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="w-full rounded-lg bg-primary text-white px-4 py-2.5 text-[13px] font-medium hover:bg-blue-600 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
