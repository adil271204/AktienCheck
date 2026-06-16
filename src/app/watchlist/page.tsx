import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AddWatchlistForm, RemoveWatchlistButton } from "@/components/dashboard/watchlist-form";
import { Disclaimer } from "@/components/shared/disclaimer";

export const dynamic = "force-dynamic";

const USER_ID = "demo-user";

export default async function WatchlistPage() {
  const items = await prisma.watchlistItem.findMany({
    where: { userId: USER_ID },
    include: { company: true },
    orderBy: { addedAt: "desc" },
  });

  const companyIds = items.map((i) => i.companyId);
  const alertCounts = await prisma.alert.groupBy({
    by: ["companyId"],
    where: { companyId: { in: companyIds } },
    _count: { _all: true },
  });
  const alertCountMap = new Map(alertCounts.map((a) => [a.companyId, a._count._all]));

  return (
    <div className="space-y-6">
      <Disclaimer compact />
      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
          <CardDescription>
            Track tickers to surface events and news that may affect them. Example tickers: AAPL, MSFT, NVDA, TSLA,
            ASML, RHM (Rheinmetall), AIR (Airbus).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddWatchlistForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/company/${item.company.ticker}`} className="font-medium text-primary hover:underline">
                      {item.company.ticker}
                    </Link>
                  </TableCell>
                  <TableCell>{item.company.name}</TableCell>
                  <TableCell>{item.company.sector}</TableCell>
                  <TableCell>{item.company.country}</TableCell>
                  <TableCell>{alertCountMap.get(item.companyId) ?? 0}</TableCell>
                  <TableCell>
                    <RemoveWatchlistButton ticker={item.company.ticker} />
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No tickers yet — add one above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
