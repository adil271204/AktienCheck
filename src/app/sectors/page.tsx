import { getAllEventTypes, getSectorImpactsForEventType } from "@/lib/services/sector-impact-engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/shared/disclaimer";
import { formatEnumLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function SectorImpactMapPage() {
  const eventTypes = getAllEventTypes();

  return (
    <div className="space-y-6">
      <Disclaimer compact />
      <Card>
        <CardHeader>
          <CardTitle>Sector Impact Map</CardTitle>
          <CardDescription>
            Curated mapping of macro/country event types to the sectors and industries they may affect, and why.
          </CardDescription>
        </CardHeader>
      </Card>

      {eventTypes.map((type) => {
        const rules = getSectorImpactsForEventType(type);
        if (rules.length === 0) return null;
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="text-base">{formatEnumLabel(type)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {rule.sector}
                      {rule.industry ? ` · ${rule.industry}` : ""}
                    </span>
                    <Badge variant="outline">
                      {rule.effectType} · {formatEnumLabel(rule.direction)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{rule.explanation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
