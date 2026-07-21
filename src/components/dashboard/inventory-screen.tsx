"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Package, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScreenHeader, LoadingPanel, EmptyState } from "@/components/dashboard/screen-kit";
import { dashboardApi, type StockLevel, type Offering } from "@/components/dashboard/data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

function InventoryItem({ offering, stockLevel, onUpdate }: { offering: Offering, stockLevel?: StockLevel, onUpdate: (id: string, quantity: number) => void }) {
  const [quantity, setQuantity] = useState(stockLevel?.quantity ?? 0);

  const handleBlur = () => {
    if (quantity !== stockLevel?.quantity) {
      onUpdate(offering._id, quantity);
    }
  };

  const isLowStock = quantity > 0 && quantity <= 5;
  const isOutOfStock = quantity === 0;

  return (
    <div className="flex items-center justify-between border-b border-black/8 py-4 last:border-0">
      <div className="min-w-0 flex-1 pr-4">
        <h4 className="truncate font-medium">{offering.name}</h4>
        <p className="mt-1 truncate text-xs text-muted-foreground">{offering.category || "Uncategorized"}</p>
      </div>
      <div className="flex items-center gap-4">
        {isOutOfStock && (
          <Badge variant="destructive" className="bg-red-500 text-white">Out of Stock</Badge>
        )}
        {isLowStock && (
          <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
            <AlertTriangle className="mr-1 size-3" /> Low Stock
          </Badge>
        )}
        <div className="w-24">
          <Input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            onBlur={handleBlur}
            className="text-right"
          />
        </div>
      </div>
    </div>
  );
}

export function InventoryScreen() {
  const { organization } = useWorkspace();
  const offerings = useQuery(
    dashboardApi.catalog.listOfferings,
    organization ? {} : "skip"
  );
  const stockLevels = useQuery(
    dashboardApi.ecommerce.getStockLevels,
    organization ? { organizationId: organization._id } : "skip"
  );
  const updateStockLevel = useMutation(dashboardApi.ecommerce.updateStockLevel);

  if (!offerings || !stockLevels || !organization) {
    return (
      <>
        <ScreenHeader
          eyebrow="Operations"
          title="Inventory Management"
          description="Track stock levels and manage product availability."
        />
        <LoadingPanel rows={6} />
      </>
    );
  }

  const handleUpdateStock = (offeringId: string, quantity: number) => {
    if (!organization) return;
    void updateStockLevel({
      organizationId: organization._id,
      offeringId,
      quantity,
    });
  };

  return (
    <>
      <ScreenHeader
        eyebrow="Operations"
        title="Inventory Management"
        description="Track stock levels and manage product availability for your AI receptionist to enforce urgency."
      />

      <Card className="bg-white">
        <CardHeader className="border-b border-black/8 pb-4">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-primary" />
            <CardTitle className="font-heading text-xl tracking-tight">
              Current Stock Levels
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Update the quantity available for each product.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offerings.length > 0 ? (
            <div className="flex flex-col">
              {offerings.map((offering) => (
                <InventoryItem
                  key={offering._id}
                  offering={offering}
                  stockLevel={stockLevels.find((s) => s.offeringId === offering._id)}
                  onUpdate={handleUpdateStock}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              icon={Package}
              title="No products found"
              description="Create products in the Offerings section first to manage their inventory."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
