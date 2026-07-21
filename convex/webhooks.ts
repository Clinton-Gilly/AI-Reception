import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

export const getOrgByChannelId = query({
  args: {
    channelId: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: Since this is querying from a webhook without auth context, 
    // it's a public query, but we only return the org ID if a match is found.
    // To make this secure, we could check verify tokens too.
    const integrations = await ctx.db
      .query("channelIntegrations")
      .withIndex("by_org_platform")
      // We can't filter purely by platform via index if we don't know the org.
      // So we do a full table scan or index scan.
      .filter((q) => q.eq(q.field("platform"), args.platform))
      .filter((q) => q.eq(q.field("status"), "connected"))
      .collect();

    for (const integration of integrations) {
      if (integration.settings) {
        try {
          const settings = JSON.parse(integration.settings);
          // Check if either phoneNumberId or pageId matches
          if (
            settings.phoneNumberId === args.channelId ||
            settings.pageId === args.channelId
          ) {
            return integration.organizationId;
          }
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    }
    return null;
  },
});

export const processWebhookMessage = mutation({
  args: {
    organizationId: v.id("organizations"),
    platform: v.string(),
    message: v.any(),
  },
  handler: async (ctx, args) => {
    // In a full implementation, you'd insert this into a conversations table 
    // and/or trigger the AI agent backend.
    console.log(
      `[Webhook] Processing ${args.platform} message for org ${args.organizationId}:`,
      args.message
    );
    
    // Example of inserting into conversations (if you had a text channel setup):
    /*
    await ctx.db.insert("conversations", {
      organizationId: args.organizationId,
      externalConversationId: args.message.from || args.message.sender?.id,
      channel: "web", // or args.platform if added to the schema
      status: "active",
      startedAt: Date.now(),
    });
    */
  },
});


export const replyToWhatsApp = action({
  args: {
    organizationId: v.id("organizations"),
    phoneNumberId: v.string(),
    toPhoneNumber: v.string(),
    messageText: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch the organization's WhatsApp tokens via a query
    const integrations = await ctx.runQuery(api.webhooks.getIntegrationsQuery, {
      organizationId: args.organizationId,
      platform: "whatsapp",
    });

    if (!integrations || integrations.length === 0) {
      console.error("No WhatsApp integration found for org", args.organizationId);
      return;
    }

    const integration = integrations[0];
    if (!integration.settings) return;
    
    const settings = JSON.parse(integration.settings);
    const accessToken = settings.accessToken;

    if (!accessToken) {
      console.error("No WhatsApp access token found for org", args.organizationId);
      return;
    }

    // 2. Send the message via Meta Graph API
    const url = `https://graph.facebook.com/v17.0/${args.phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: args.toPhoneNumber,
        type: "text",
        text: { body: args.messageText },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to send WhatsApp message:", errorData);
    } else {
      console.log(`WhatsApp message sent to ${args.toPhoneNumber}`);
    }
  },
});

export const getIntegrationsQuery = query({
  args: {
    organizationId: v.id("organizations"),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channelIntegrations")
      .withIndex("by_org_platform", (q) =>
        q.eq("organizationId", args.organizationId).eq("platform", args.platform)
      )
      .collect();
  },
});
