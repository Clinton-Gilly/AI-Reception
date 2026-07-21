import { auth } from "@clerk/nextjs/server";
import { InventoryScreen } from "@/components/dashboard/inventory-screen";

export default async function InventoryPage() {
  await auth.protect();
  return <InventoryScreen />;
}
