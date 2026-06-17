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
  { href: "/macro-events", label: "Macro Event Radar", icon: Radio },
  { href: "/sectors", label: "Sector Impact Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
        <Link href="/" className="mr-4 flex items-center gap-2 font-semibold shrink-0">
          <LineChart className="h-5 w-5 text-primary" />
          <span className="whitespace-nowrap hidden sm:block">Market Event Impact Intelligence</span>
        </Link>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
        <div className="ml-auto pl-2 w-52 shrink-0">
          <CompanySearch />
        </div>
      </div>
    </nav>
  );
}
