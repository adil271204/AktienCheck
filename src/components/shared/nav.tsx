"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ListChecks, Radio, Map, Bell, LineChart, Building2 } from "lucide-react";
import { CompanySearch } from "@/components/company-search";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/macro-events", label: "Macro Radar", icon: Radio },
  { href: "/sectors", label: "Sector Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-card w-full">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Row 1: logo + nav links */}
        <div className="flex flex-wrap items-center gap-1 py-2">
          <Link href="/" className="mr-3 flex items-center gap-2 font-semibold shrink-0">
            <LineChart className="h-5 w-5 text-primary" />
            <span className="hidden sm:block whitespace-nowrap text-sm">Market Event Impact</span>
          </Link>

          <div className="flex flex-wrap items-center gap-1 min-w-0">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Row 2: full-width search bar */}
        <div className="pb-2">
          <CompanySearch className="w-full" />
        </div>
      </div>
    </nav>
  );
}
