"use client";

import { useState } from "react";
import { PricingTable, useAuth } from "@clerk/nextjs";
import { Check, CreditCard, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureEntitlementCard } from "@/components/dashboard/feature-gates";
import { ScreenHeader } from "@/components/dashboard/screen-kit";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { MpesaSubscriptionModal } from "@/components/public-site/mpesa-payment";

export function BillingScreen() {
  const { has, isLoaded } = useAuth();
  const { organization } = useWorkspace();
  const [selectedMpesaPlan, setSelectedMpesaPlan] = useState<"engage" | "voice" | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);

  const orgTier = organization?.subscriptionTier;
  const currentTier = has?.({ plan: "org:voice" }) || orgTier === "voice"
    ? "Voice"
    : has?.({ plan: "org:engage" }) || orgTier === "engage"
      ? "Engage"
      : "Core";

  return (
    <>
      <ScreenHeader
        eyebrow="Organization subscription"
        title="Billing"
        description={`Plans, features, and billing belong to ${organization?.name ?? "this organization"}—not to individual members. Upgrades take effect across the active workspace.`}
      />

      <section className="grid gap-4 md:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        <Card className="bg-[#20201e] text-white ring-black/15">
          <CardContent className="flex h-full flex-col justify-between pt-0">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-white/10">
                  <CreditCard className="size-4 text-primary" />
                </span>
                <Badge variant="outline" className="border-white/15 bg-white/5 text-white">
                  Active
                </Badge>
              </div>
              <p className="mt-8 text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                Current plan
              </p>
              <p className="mt-1 font-heading text-4xl font-semibold tracking-[-0.045em]">
                {isLoaded ? currentTier : "—"}
              </p>
              <p className="mt-3 text-xs leading-5 text-white/50">
                Feature access is checked from the active Clerk organization on
                every authenticated session.
              </p>
            </div>
            <div className="mt-8 space-y-2 border-t border-white/10 pt-4 text-[11px] text-white/60">
              <p className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-emerald-400" /> Organization-scoped billing
              </p>
              <p className="flex items-center gap-2">
                <UsersRound className="size-3.5 text-sky-400" /> Seat limits enforced by Clerk
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <FeatureEntitlementCard feature="web_agent" />
          <FeatureEntitlementCard feature="browser_voice" />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
              Compare plans
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.025em]">
              Choose the channels you need.
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex">
            <Check className="size-3.5" /> Secure in-app checkout
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-3 sm:p-5">
          <PricingTable
            for="organization"
            newSubscriptionRedirectUrl={`/app/${organization?.slug ?? ""}/billing`}
            fallback={
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((value) => (
                  <div key={value} className="space-y-4 rounded-xl border p-5">
                    <Skeleton className="size-9 rounded-lg" />
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-green-600 uppercase">
              M-Pesa Alternatives
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-[-0.025em]">
              Pay with M-Pesa.
            </h2>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex">
            <Check className="size-3.5" /> Manual monthly renewal
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
           <Card className="flex flex-col justify-between">
              <CardContent className="pt-6">
                 <h3 className="text-xl font-bold font-heading">Engage</h3>
                 <p className="text-sm text-muted-foreground mt-2">Add an ElevenLabs web concierge to every customer touchpoint.</p>
                 <div className="mt-4 mb-6">
                    <span className="text-3xl font-bold">KES 5,000</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                 </div>
                 <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedMpesaPlan("engage"); setShowMpesaModal(true); }}>
                    Buy with M-Pesa
                 </Button>
              </CardContent>
           </Card>
           <Card className="flex flex-col justify-between">
              <CardContent className="pt-6">
                 <h3 className="text-xl font-bold font-heading">Voice</h3>
                 <p className="text-sm text-muted-foreground mt-2">Add live browser audio to the web concierge and measure every outcome.</p>
                 <div className="mt-4 mb-6">
                    <span className="text-3xl font-bold">KES 15,500</span>
                    <span className="text-muted-foreground text-sm">/month</span>
                 </div>
                 <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedMpesaPlan("voice"); setShowMpesaModal(true); }}>
                    Buy with M-Pesa
                 </Button>
              </CardContent>
           </Card>
        </div>
      </section>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-black/10 bg-white p-3 text-[11px] leading-5 text-muted-foreground">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
        Switchboard gates capabilities by Clerk feature entitlement, so a feature
        can move between plans without changing application code.
      </div>

      {showMpesaModal && selectedMpesaPlan && organization && (
        <MpesaSubscriptionModal
          organizationId={organization._id}
          planType={selectedMpesaPlan}
          amount={selectedMpesaPlan === "engage" ? 5000 : 15500}
          onSuccess={(paymentId) => {
             setShowMpesaModal(false);
             window.location.reload();
          }}
          onCancel={() => setShowMpesaModal(false)}
        />
      )}
    </>
  );
}
