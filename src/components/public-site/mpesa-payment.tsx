"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { CreditCard, Smartphone, LoaderCircle, CheckCircle, XCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PaymentMethod = "card" | "mpesa";

export function PaymentMethodPicker({
  selected,
  onSelect,
}: {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onSelect("card")}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
          selected === "card"
            ? "border-primary bg-primary/5 text-primary"
            : "border-border text-muted-foreground"
        )}
      >
        <CreditCard className="size-6" />
        <span className="font-semibold">Card</span>
      </button>
      
      <button
        type="button"
        onClick={() => onSelect("mpesa")}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-green-500/10",
          selected === "mpesa"
            ? "border-green-500 bg-green-500/10 text-green-700"
            : "border-border text-muted-foreground"
        )}
      >
        <div className="flex items-center justify-center rounded-full bg-green-500 p-1.5 text-white">
          <Smartphone className="size-4" />
        </div>
        <span className="font-semibold">M-Pesa</span>
      </button>
    </div>
  );
}

export function MpesaPaymentModal({
  siteSlug,
  phone: initialPhone,
  amount,
  onSuccess,
  onCancel,
}: {
  siteSlug: string;
  phone: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [status, setStatus] = useState<"idle" | "requesting" | "polling" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  
  const createPaymentRecord = useMutation(api.mpesa.createPaymentRecord);
  const paymentStatus = useQuery(
    api.mpesa.getPaymentStatus,
    checkoutRequestId ? { checkoutRequestId } : "skip"
  );

  useEffect(() => {
    if (status === "polling" && paymentStatus) {
      if (paymentStatus.status === "success") {
        setStatus("success");
      } else if (paymentStatus.status === "failed" || paymentStatus.status === "cancelled") {
        setStatus("failed");
        setErrorMessage(paymentStatus.resultDescription || "Payment failed or was cancelled.");
      }
    }
  }, [status, paymentStatus]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("requesting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("failed");
        setErrorMessage(data.error || "Failed to initiate payment");
        return;
      }

      await createPaymentRecord({
        siteSlug,
        phone,
        amountMinor: Math.round(amount * 100),
        currency: "KES",
        checkoutRequestId: data.checkoutRequestId,
        merchantRequestId: data.merchantRequestId,
      });

      setCheckoutRequestId(data.checkoutRequestId);
      setStatus("polling");

    } catch (error) {
      setStatus("failed");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold font-heading mb-4 text-center flex items-center justify-center gap-2">
          <div className="bg-green-500 text-white rounded-full p-1">
             <Smartphone className="size-4" />
          </div>
          Lipa na M-Pesa
        </h2>

        {status === "idle" || status === "requesting" ? (
          <form onSubmit={handlePay} className="space-y-4">
             <div>
              <Label>M-Pesa Phone Number</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="2547XXXXXXXX" 
                required 
                disabled={status === "requesting"}
              />
              <p className="text-xs text-muted-foreground mt-1">Must be a valid Safaricom number.</p>
            </div>
            
            <div className="pt-2">
               <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={status === "requesting"}>
                  {status === "requesting" ? (
                     <><LoaderCircle className="size-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                     `Pay KES ${amount.toLocaleString()}`
                  )}
               </Button>
               <Button type="button" variant="ghost" className="w-full mt-2" onClick={onCancel} disabled={status === "requesting"}>
                 Cancel
               </Button>
            </div>
          </form>
        ) : null}

        {status === "polling" ? (
          <div className="text-center py-6 space-y-4">
            <LoaderCircle className="size-10 text-green-500 animate-spin mx-auto" />
            <p className="font-medium text-lg">Check your phone</p>
            <p className="text-sm text-muted-foreground">
              We've sent an M-Pesa prompt to <b>{phone}</b>. Enter your PIN to complete the payment.
            </p>
            <p className="text-xs text-muted-foreground animate-pulse pt-2">Waiting for confirmation...</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="size-12 text-green-500 mx-auto" />
            <p className="font-medium text-xl">Payment Successful!</p>
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={() => onSuccess(checkoutRequestId)}>
               Continue
            </Button>
          </div>
        ) : null}

        {status === "failed" ? (
           <div className="text-center py-6 space-y-4">
            <XCircle className="size-12 text-destructive mx-auto" />
            <p className="font-medium text-xl text-destructive">Payment Failed</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button className="w-full mt-4" variant="outline" onClick={() => setStatus("idle")}>
               Try Again
            </Button>
            <Button type="button" variant="ghost" className="w-full mt-2" onClick={onCancel}>
                 Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MpesaSubscriptionModal({
  organizationId,
  planType,
  amount,
  onSuccess,
  onCancel,
}: {
  organizationId: string;
  planType: "engage" | "voice";
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "requesting" | "polling" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  
  // @ts-ignore
  const createSubscriptionPayment = useMutation(api.mpesa.createSubscriptionPayment);
  const paymentStatus = useQuery(
    api.mpesa.getPaymentStatus,
    checkoutRequestId ? { checkoutRequestId } : "skip"
  );

  useEffect(() => {
    if (status === "polling" && paymentStatus) {
      if (paymentStatus.status === "success") {
        setStatus("success");
      } else if (paymentStatus.status === "failed" || paymentStatus.status === "cancelled") {
        setStatus("failed");
        setErrorMessage(paymentStatus.resultDescription || "Payment failed or was cancelled.");
      }
    }
  }, [status, paymentStatus]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("requesting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("failed");
        setErrorMessage(data.error || "Failed to initiate payment");
        return;
      }

      await createSubscriptionPayment({
        organizationId: organizationId as any,
        planType,
        phone,
        amountMinor: Math.round(amount * 100),
        currency: "KES",
        checkoutRequestId: data.checkoutRequestId,
        merchantRequestId: data.merchantRequestId,
      });

      setCheckoutRequestId(data.checkoutRequestId);
      setStatus("polling");

    } catch (error) {
      setStatus("failed");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold font-heading mb-4 text-center flex items-center justify-center gap-2">
          <div className="bg-green-500 text-white rounded-full p-1">
             <Smartphone className="size-4" />
          </div>
          Pay {planType === "engage" ? "Engage" : "Voice"} with M-Pesa
        </h2>

        {status === "idle" || status === "requesting" ? (
          <form onSubmit={handlePay} className="space-y-4">
             <div>
              <Label>M-Pesa Phone Number</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="2547XXXXXXXX" 
                required 
                disabled={status === "requesting"}
              />
              <p className="text-xs text-muted-foreground mt-1">Must be a valid Safaricom number.</p>
            </div>
            
            <div className="pt-2">
               <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={status === "requesting"}>
                  {status === "requesting" ? (
                     <><LoaderCircle className="size-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                     `Pay KES ${amount.toLocaleString()}`
                  )}
               </Button>
               <Button type="button" variant="ghost" className="w-full mt-2" onClick={onCancel} disabled={status === "requesting"}>
                 Cancel
               </Button>
            </div>
          </form>
        ) : null}

        {status === "polling" ? (
          <div className="text-center py-6 space-y-4">
            <LoaderCircle className="size-10 text-green-500 animate-spin mx-auto" />
            <p className="font-medium text-lg">Check your phone</p>
            <p className="text-sm text-muted-foreground">
              We've sent an M-Pesa prompt to <b>{phone}</b>. Enter your PIN to complete the payment.
            </p>
            <p className="text-xs text-muted-foreground animate-pulse pt-2">Waiting for confirmation...</p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="size-12 text-green-500 mx-auto" />
            <p className="font-medium text-xl">Payment Successful!</p>
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={() => onSuccess(checkoutRequestId)}>
               Continue
            </Button>
          </div>
        ) : null}

        {status === "failed" ? (
           <div className="text-center py-6 space-y-4">
            <XCircle className="size-12 text-destructive mx-auto" />
            <p className="font-medium text-xl text-destructive">Payment Failed</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button className="w-full mt-4" variant="outline" onClick={() => setStatus("idle")}>
               Try Again
            </Button>
            <Button type="button" variant="ghost" className="w-full mt-2" onClick={onCancel}>
                 Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
