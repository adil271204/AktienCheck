"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Building2, MapPin, Layers, Plus, Minus, TrendingUp, TrendingDown, MoveHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore } from "@/lib/utils";

interface LatestAnalysis {
  sentiment: string;
  headlineImpactScore: number;
  adjustedImpactScore: number;
  confidence: number;
  pricedInStatus: string;
}

interface CompanyResult {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  country: string;
  description: string | null;
  isInWatchlist: boolean;
  latestAnalysis: LatestAnalysis | null;
}

interface Props {
  initialCompanies: CompanyResult[];
  sectors: string[];
  countries: string[];
}

function SignalBadge({ score }: { score: number }) {
  const positive = score > 0.05;
  const negative = score < -0.05;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono font-semibold",
        positive && "bg-bullish/15 text-bullish",
        negative && "bg-bearish/15 text-bearish",
        !positive && !negative && "bg-muted text-muted-foreground"
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <MoveHorizontal className="h-3 w-3" />}
      {formatScore(score)}
    </span>
  );
}

function PricedInPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    NOT_PRICED_IN: "Not priced in",
    PARTIALLY_PRICED_IN: "Partial",
    MOSTLY_PRICED_IN: "Mostly priced in",
    UNKNOWN: "Unknown",
  };
  return (
    <Badge variant="outline" className="text-xs">
      {label[status] ?? status}
    </Badge>
  );
}

export function CompaniesClient({ initialCompanies, sectors, countries }: Props) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [companies, setCompanies] = useState<CompanyResult[]>(initialCompanies);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlistPending, setWatchlistPending] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCompanies = useCallback(async (q: string, sec: string, cty: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (sec) params.set("sector", sec);
      if (cty) params.set("country", cty);
      params.set("limit", "50");
      const res = await fetch(`/api/companies/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setCompanies(data.companies);
    } catch {
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search when query changes; sector/country filters apply immediately
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCompanies(query, sector, country), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sector, country, fetchCompanies]);

  async function toggleWatchlist(ticker: string, isInWatchlist: boolean) {
    setWatchlistPending(ticker);
    try {
      if (isInWatchlist) {
        await fetch(`/api/watchlist/${ticker}`, { method: "DELETE" });
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
      }
      // Refresh to get updated watchlist state
      await fetchCompanies(query, sector, country);
      startTransition(() => router.refresh());
    } finally {
      setWatchlistPending(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search ticker, name, sector, country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          aria-label="Filter by sector"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Filter by country"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(query || sector || country) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setQuery(""); setSector(""); setCountry(""); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Status line */}
      <p className="text-sm text-muted-foreground">
        {loading ? "Searching…" : `${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
        {sector && ` · ${sector}`}
        {country && ` · ${country}`}
      </p>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-bearish/30 bg-bearish/10 px-4 py-3 text-sm text-bearish">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && companies.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border py-16 text-center text-muted-foreground">
          <Building2 className="h-8 w-8 opacity-40" />
          <p className="text-sm">No companies found for your search.</p>
          <p className="text-xs">Try a different ticker, name, or sector.</p>
        </div>
      )}

      {/* Results grid */}
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", loading && "opacity-60 pointer-events-none")}>
        {companies.map((company) => (
          <Card key={company.id} className="flex flex-col justify-between gap-0 p-0 overflow-hidden">
            <CardContent className="flex flex-col gap-3 p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/company/${company.ticker}`}
                  className="group flex-1"
                >
                  <p className="font-mono text-sm font-bold text-primary group-hover:underline">
                    {company.ticker}
                  </p>
                  <p className="text-sm font-medium leading-tight">{company.name}</p>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "shrink-0 gap-1",
                    company.isInWatchlist && "border-primary/50 text-primary"
                  )}
                  disabled={watchlistPending === company.ticker}
                  onClick={() => toggleWatchlist(company.ticker, company.isInWatchlist)}
                  title={company.isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                >
                  {company.isInWatchlist ? (
                    <><Minus className="h-3.5 w-3.5" /> Watching</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /> Watch</>
                  )}
                </Button>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {company.sector}
                </span>
                {company.industry && (
                  <span className="text-muted-foreground/60">· {company.industry}</span>
                )}
                <span className="flex items-center gap-1 ml-auto">
                  <MapPin className="h-3 w-3" />
                  {company.country}
                </span>
              </div>

              {/* Description */}
              {company.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{company.description}</p>
              )}

              {/* Latest analysis signal */}
              {company.latestAnalysis ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Latest signal:</span>
                  <SignalBadge score={company.latestAnalysis.adjustedImpactScore} />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(company.latestAnalysis.confidence * 100)}% conf.
                  </span>
                  <PricedInPill status={company.latestAnalysis.pricedInStatus} />
                </div>
              ) : (
                <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                  No analysis yet — run the pipeline to generate signals.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
