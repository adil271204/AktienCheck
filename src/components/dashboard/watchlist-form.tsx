"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddWatchlistForm() {
  const [ticker, setTicker] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: ticker.trim().toUpperCase() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add ticker");
      return;
    }
    setTicker("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <div className="flex-1">
        <Input
          placeholder="Add ticker, e.g. AAPL"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          maxLength={12}
        />
        {error && <p className="mt-1 text-xs text-bearish">{error}</p>}
      </div>
      <Button type="submit" disabled={isPending || !ticker.trim()}>
        Add
      </Button>
    </form>
  );
}

export function RemoveWatchlistButton({ ticker }: { ticker: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRemove() {
    await fetch(`/api/watchlist/${ticker}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRemove} disabled={isPending}>
      Remove
    </Button>
  );
}
