import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentOrganizationOperator } from "./lib/auth";

export const getIntegrations = query({
  args: {},
  handler: async (ctx) => {
    const { organization } = await requireCurrentOrganizationOperator(ctx);
    return await ctx.db
      .query("channelIntegrations")
      .withIndex("by_organization", (q) => q.eq("organizationId", organization._id))
      .collect();
  },
});

export const saveIntegration = mutation({
  args: {
    platform: v.string(),
    status: v.union(v.literal("connected"), v.literal("disconnected")),
    settings: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organization } = await requireCurrentOrganizationOperator(ctx);

    const existing = await ctx.db
      .query("channelIntegrations")
      .withIndex("by_org_platform", (q) =>
        q.eq("organizationId", organization._id).eq("platform", args.platform)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        settings: args.settings,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("channelIntegrations", {
        organizationId: organization._id,
        platform: args.platform,
        status: args.status,
        settings: args.settings,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
