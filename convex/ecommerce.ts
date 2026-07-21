import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addReview = mutation({
  args: {
    siteSlug: v.string(),
    offeringId: v.id("offerings"),
    rating: v.number(),
    comment: v.string(),
    reviewerName: v.string(),
  },
  handler: async (ctx, args) => {
    const siteSlug = args.siteSlug.trim().toLowerCase();
    const site = await ctx.db
      .query("publicSites")
      .withIndex("by_site_slug", (q) => q.eq("siteSlug", siteSlug))
      .unique();
    if (!site?.published) throw new Error("Published site not found.");
    
    // Verify offering belongs to org
    const offering = await ctx.db.get(args.offeringId);
    if (!offering || offering.organizationId !== site.organizationId) {
      throw new Error("Invalid offering");
    }

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    await ctx.db.insert("productReviews", {
      organizationId: site.organizationId,
      offeringId: args.offeringId,
      rating: args.rating,
      comment: args.comment.trim(),
      reviewerName: args.reviewerName.trim(),
      createdAt: Date.now(),
    });
  },
});

export const getReviewsForOffering = query({
  args: {
    offeringId: v.id("offerings"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("productReviews")
      .withIndex("by_offering", (q) => q.eq("offeringId", args.offeringId))
      .order("desc")
      .collect();
      
    return reviews;
  },
});

export const getStockLevels = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stockLevels")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const updateStockLevel = mutation({
  args: {
    organizationId: v.id("organizations"),
    offeringId: v.id("offerings"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stockLevels")
      .withIndex("by_offering", (q) => q.eq("offeringId", args.offeringId))
      .unique();

    if (existing) {
      if (existing.organizationId !== args.organizationId) {
         throw new Error("Invalid organization");
      }
      return await ctx.db.patch(existing._id, {
        quantity: args.quantity,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.insert("stockLevels", {
      organizationId: args.organizationId,
      offeringId: args.offeringId,
      quantity: args.quantity,
      updatedAt: Date.now(),
    });
  },
});

export const getSalesAnalytics = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // For a real app, this might use @convex-dev/aggregate
    // We just do a simple fetch here for the demo.
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const events = await ctx.db
      .query("aiSalesEvents")
      .withIndex("by_org_created", (q) => 
        q.eq("organizationId", args.organizationId).gte("createdAt", thirtyDaysAgo)
      )
      .collect();

    // Fetch all offerings to map names
    const offerings = await ctx.db
      .query("offerings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    
    const offeringNames = new Map(offerings.map(o => [o._id, o.name]));

    return {
      events: events.map(e => ({
        ...e,
        offeringName: offeringNames.get(e.offeringId) || "Unknown",
      }))
    };
  },
});

export const recordSaleEvent = mutation({
  args: {
    organizationId: v.id("organizations"),
    offeringId: v.id("offerings"),
    revenueMinor: v.number(),
    discountMinor: v.number(),
    discountPercentage: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiSalesEvents", {
      organizationId: args.organizationId,
      offeringId: args.offeringId,
      revenueMinor: args.revenueMinor,
      discountMinor: args.discountMinor,
      discountPercentage: args.discountPercentage,
      createdAt: Date.now(),
    });
  },
});
