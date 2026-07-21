import { auth } from "@clerk/nextjs/server";
import { SalesAnalyticsScreen } from "@/components/dashboard/sales-analytics-screen";

export default async function SalesAnalyticsPage() {
  await auth.protect();
  return <SalesAnalyticsScreen />;
}
