import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPaymentRecord = mutation({
  args: {
    siteSlug: v.string(),
    phone: v.string(),
    amountMinor: v.number(),
    currency: v.string(),
    checkoutRequestId: v.string(),
    merchantRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    const siteSlug = args.siteSlug.trim().toLowerCase();
    const site = await ctx.db
      .query("publicSites")
      .withIndex("by_site_slug", (q) => q.eq("siteSlug", siteSlug))
      .unique();
    
    if (!site?.published) {
      throw new Error("Published site not found.");
    }

    const paymentId = await ctx.db.insert("mpesaPayments", {
      organizationId: site.organizationId,
      siteSlug: args.siteSlug,
      checkoutRequestId: args.checkoutRequestId,
      merchantRequestId: args.merchantRequestId,
      phone: args.phone,
      amountMinor: args.amountMinor,
      currency: args.currency,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

export const createSubscriptionPayment = mutation({
  args: {
    organizationId: v.id("organizations"),
    planType: v.union(v.literal("engage"), v.literal("voice")),
    phone: v.string(),
    amountMinor: v.number(),
    currency: v.string(),
    checkoutRequestId: v.string(),
    merchantRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    const paymentId = await ctx.db.insert("mpesaPayments", {
      organizationId: args.organizationId,
      siteSlug: "subscription", // Placeholder for internal payments
      isSubscription: true,
      planType: args.planType,
      checkoutRequestId: args.checkoutRequestId,
      merchantRequestId: args.merchantRequestId,
      phone: args.phone,
      amountMinor: args.amountMinor,
      currency: args.currency,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return paymentId;
  },
});

export const updatePaymentStatus = mutation({
  args: {
    checkoutRequestId: v.string(),
    merchantRequestId: v.string(),
    resultCode: v.number(),
    resultDescription: v.string(),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("mpesaPayments")
      .withIndex("by_checkout_request", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .unique();

    if (!payment) {
      console.error(`Payment not found for checkout request: ${args.checkoutRequestId}`);
      return;
    }

    if (payment.merchantRequestId !== args.merchantRequestId) {
       console.error(`Merchant Request ID mismatch`);
       return;
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      resultCode: args.resultCode,
      resultDescription: args.resultDescription,
      updatedAt: Date.now(),
    });

    // If it's a successful subscription payment, grant the entitlement
    if (args.status === "success" && payment.isSubscription && payment.organizationId && payment.planType) {
      await ctx.db.patch(payment.organizationId, {
        subscriptionTier: payment.planType,
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        updatedAt: Date.now(),
      });
    }
  },
});

export const getPaymentStatus = query({
  args: {
    checkoutRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("mpesaPayments")
      .withIndex("by_checkout_request", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .unique();

    if (!payment) {
      return null;
    }

    return {
      status: payment.status,
      resultDescription: payment.resultDescription,
    };
  },
});

export const updatePaymentBooking = mutation({
  args: {
    checkoutRequestId: v.string(),
    bookingId: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("mpesaPayments")
      .withIndex("by_checkout_request", (q) => q.eq("checkoutRequestId", args.checkoutRequestId))
      .unique();

    if (!payment) {
      throw new Error(`Payment not found for checkout request: ${args.checkoutRequestId}`);
    }

    await ctx.db.patch(payment._id, {
      bookingId: args.bookingId,
      updatedAt: Date.now(),
    });
  },
});
