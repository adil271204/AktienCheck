import { redirect } from "next/navigation";

// Redirect /companies/[ticker] → /company/[ticker] (canonical detail route)
export default function CompaniesTickerRedirect({ params }: { params: { ticker: string } }) {
  redirect(`/company/${params.ticker.toUpperCase()}`);
}
