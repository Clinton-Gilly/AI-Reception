import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSettings = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    let settings = await ctx.db
      .query("ecommerceSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .unique();

    if (!settings) {
      // Return defaults if not set
      return {
        _id: "default",
        organizationId: args.organizationId,
        bargainingStyle: "strict" as const,
        maxDiscountPercentage: 0,
        languageEnglish: true,
        languageKiswahili: false,
        languageSheng: false,
        updatedAt: Date.now(),
      };
    }

    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    organizationId: v.id("organizations"),
    bargainingStyle: v.union(v.literal("strict"), v.literal("lenient")),
    maxDiscountPercentage: v.number(),
    languageEnglish: v.boolean(),
    languageKiswahili: v.boolean(),
    languageSheng: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ecommerceSettings")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .unique();

    if (existing) {
      return await ctx.db.patch(existing._id, {
        bargainingStyle: args.bargainingStyle,
        maxDiscountPercentage: args.maxDiscountPercentage,
        languageEnglish: args.languageEnglish,
        languageKiswahili: args.languageKiswahili,
        languageSheng: args.languageSheng,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.insert("ecommerceSettings", {
      organizationId: args.organizationId,
      bargainingStyle: args.bargainingStyle,
      maxDiscountPercentage: args.maxDiscountPercentage,
      languageEnglish: args.languageEnglish,
      languageKiswahili: args.languageKiswahili,
      languageSheng: args.languageSheng,
      updatedAt: Date.now(),
    });
  },
});
