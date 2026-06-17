"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnalyzeButton({ ticker }: { ticker: string }) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleClick() {
    setStatus("running");
    try {
      const res = await fetch(`/api/companies/${ticker}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error("Analysis failed");
      setStatus("done");
      // Refresh the page so the new analyses render
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") return null; // page will re-render with analyses

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={status === "running"}
      className="gap-1.5"
    >
      {status === "running" ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Analyzing…
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5" />
          {status === "error" ? "Retry analysis" : "Run analysis"}
        </>
      )}
    </Button>
  );
}
