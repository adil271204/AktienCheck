"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  country: string;
}

export function CompanySearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}&limit=8`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.companies ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  function navigate(ticker: string) {
    router.push(`/company/${ticker}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(results[activeIndex].ticker);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && (loading || results.length > 0 || query.trim().length > 0);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="company-search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `csr-${activeIndex}` : undefined}
          className="w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search companies…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => { e.preventDefault(); setQuery(""); setResults([]); inputRef.current?.focus(); }}
            tabIndex={-1}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          id="company-search-listbox"
          role="listbox"
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-card shadow-lg"
        >
          {loading && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-pulse">Searching…</span>
            </li>
          )}
          {!loading && results.length === 0 && query.trim() && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              No companies found for &ldquo;{query}&rdquo;
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`csr-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors",
                i === activeIndex ? "bg-muted" : "hover:bg-muted/60"
              )}
              onMouseDown={(e) => { e.preventDefault(); navigate(r.ticker); }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="w-14 shrink-0 font-mono font-bold text-primary">{r.ticker}</span>
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">{r.sector}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
