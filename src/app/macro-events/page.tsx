import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { formatDate, formatEnumLabel } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MacroEventRadarPage() {
  const events = await prisma.macroEvent.findMany({
    include: {
      source: true,
      sectorImpacts: { include: { companyImpacts: { include: { company: true } } } },
    },
    orderBy: { occurredAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Disclaimer compact />
      <Card>
        <CardHeader>
          <CardTitle>Macro / Country Event Radar</CardTitle>
          <CardDescription>
            Mock country-level and macro events with hypothesized direct and indirect sector effects.
          </CardDescription>
        </CardHeader>
      </Card>

      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{event.title}</CardTitle>
              <Badge variant="outline">{formatEnumLabel(event.type)}</Badge>
            </div>
            <CardDescription>
              {event.country} · {formatDate(event.occurredAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{event.description}</p>
            {event.source && (
              <a href={event.source.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                Source: {event.source.publisher}
              </a>
            )}

            <div className="space-y-2 pt-2">
              {event.sectorImpacts.map((si) => (
                <div key={si.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {si.sector}
                      {si.industry ? ` · ${si.industry}` : ""}
                    </span>
                    <Badge variant="outline">
                      {si.effectType} · {formatEnumLabel(si.direction)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{si.explanation}</p>
                  {si.companyImpacts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {si.companyImpacts.map((ci) => (
                        <Link key={ci.id} href={`/company/${ci.company.ticker}`}>
                          <Badge variant="default">{ci.company.ticker}</Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {events.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No macro events yet. They are populated by the mock collector job (run automatically on schedule, or via
            seeding).
          </CardContent>
        </Card>
      )}
    </div>
  );
}
