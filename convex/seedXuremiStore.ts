import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { slugify } from "./lib/defaults";

const VALID_CLOTHES_IDS = [
  "1512436991641-6745cdb1723f",
  "1572804013309-59a88b7e92f1",
  "1532453288672-3a27e9be9efd",
  "1503342394128-c104d54dba01",
  "1515886657613-9f3515b0c78f",
  "1551232864-3f0890e580d9",
  "1503341455253-b2e723bb3dbb",
  "1503342217505-b0a15ec3261c",
];

const VALID_SHOES_IDS = [
  "1542291026-7eec264c27ff",
  "1608231387042-66d1773070a5",
  "1595461135849-bf08893fdc2c",
  "1595461135882-7d2dceb5c468",
  "1549298916-b41d501d3772",
  "1551107696-a4b0c5a0d9a2",
];

const CLOTHES_NAMES = [
  "Classic White T-Shirt",
  "Denim Jacket",
  "Summer Floral Dress",
  "Black Leather Jacket",
  "Cozy Wool Sweater",
  "Athletic Leggings",
  "Vintage Graphic Tee",
  "Tailored Chinos",
  "Silk Blouse",
  "Puffer Vest",
  "Plaid Flannel Shirt",
  "High-Waisted Jeans",
  "Cotton Polo",
  "Trench Coat",
  "Linen Button-Down",
];

const SHOES_NAMES = [
  "Red Running Sneakers",
  "Classic Leather Boots",
  "White Canvas Kicks",
  "Formal Oxford Shoes",
  "High-Top Basketball Shoes",
  "Suede Loafers",
  "Comfortable Slip-Ons",
  "Platform Sandals",
  "Hiking Boots",
  "Running Trainers",
  "Minimalist White Sneakers",
  "Chunky Dad Shoes",
  "Skate Shoes",
  "Elegant Heels",
  "Chelsea Boots",
];

export default action({
  args: {},
  handler: async (ctx) => {
    console.log("Fetching images and uploading to Convex Storage...");

    const items: Array<{ name: string; category: string; priceMinor: number; imageId: any }> = [];

    // Clothes
    for (let i = 0; i < 15; i++) {
      console.log(`Processing clothing item ${i + 1}/15`);
      const validId = VALID_CLOTHES_IDS[i % VALID_CLOTHES_IDS.length];
      const url = `https://images.unsplash.com/photo-${validId}?w=600&h=600&fit=crop&q=80`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await res.blob();
        const imageId = await ctx.storage.store(blob);
        items.push({
          name: CLOTHES_NAMES[i],
          category: "Clothing",
          priceMinor: Math.floor(Math.random() * 25000) + 250000, // 2500 - 2750 KES
          imageId,
        });
      } catch (err) {
        console.error(`Error with clothing ${i}:`, err);
      }
    }

    // Shoes
    for (let i = 0; i < 15; i++) {
      console.log(`Processing shoe item ${i + 1}/15`);
      const validId = VALID_SHOES_IDS[i % VALID_SHOES_IDS.length];
      const url = `https://images.unsplash.com/photo-${validId}?w=600&h=600&fit=crop&q=80`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await res.blob();
        const imageId = await ctx.storage.store(blob);
        items.push({
          name: SHOES_NAMES[i],
          category: "Footwear",
          priceMinor: Math.floor(Math.random() * 25000) + 250000, // 2500 - 2750 KES
          imageId,
        });
      } catch (err) {
        console.error(`Error with shoe ${i}:`, err);
      }
    }

    console.log(`Successfully prepared ${items.length} items. Inserting into DB...`);
    await ctx.runMutation(internal.seedXuremiStore.insertItems, { items });
    console.log("Seeding complete!");
  },
});

export const insertItems = internalMutation({
  args: { items: v.any() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Xuremi Store"))
      .first();

    if (!org) {
      throw new Error("Could not find organization 'Xuremi Store'. Have you created it?");
    }

    await ctx.db.patch(org._id, {
      businessType: "ecommerce",
    });

    // Clear existing
    const existing = await ctx.db
      .query("offerings")
      .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
      .collect();
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    const now = Date.now();
    for (const item of args.items) {
      const offeringId = await ctx.db.insert("offerings", {
        organizationId: org._id,
        name: item.name,
        slug: slugify(item.name + "-" + Math.random().toString(36).slice(2, 7)),
        description: `Premium quality ${item.name.toLowerCase()} available now at Xuremi Store.`,
        category: item.category,
        imageId: item.imageId,
        durationMinutes: 15,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        priceMinor: item.priceMinor,
        currency: org.currency,
        capacity: 100,
        active: true,
        bookableOnline: true,
        createdAt: now,
        updatedAt: now,
      });

      // Add stock level
      await ctx.db.insert("stockLevels", {
        organizationId: org._id,
        offeringId,
        quantity: Math.floor(Math.random() * 50) + 1, // Random stock between 1 and 50
        updatedAt: now,
      });

      // Add mock sales events (2 to 5 sales per product spread over last 30 days)
      const numSales = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < numSales; j++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const eventTime = now - daysAgo * 24 * 60 * 60 * 1000;
        const discountPct = Math.floor(Math.random() * 15); // 0-15% discount
        const discountMinor = Math.floor(item.priceMinor * (discountPct / 100));
        const revenueMinor = item.priceMinor - discountMinor;

        await ctx.db.insert("aiSalesEvents", {
          organizationId: org._id,
          offeringId,
          revenueMinor,
          discountMinor,
          discountPercentage: discountPct,
          createdAt: eventTime,
        });
      }
    }

    // Add Bargaining Knowledge Item
    const existingKnowledge = await ctx.db
      .query("knowledgeItems")
      .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
      .filter((q) => q.eq(q.field("title"), "Bargaining Instructions"))
      .first();

    if (!existingKnowledge) {
      await ctx.db.insert("knowledgeItems", {
        organizationId: org._id,
        title: "Bargaining Instructions",
        content: `You are a Kenyan sales representative. If a customer wants to bargain on price, you should negotiate with them.
Rules for bargaining:
1. Speak in a friendly, uniquely Kenyan way! Mix in Kiswahili and common Sheng words where appropriate (e.g., "Sasa", "Niaje", "Poa", "Karibu", "Mambo").
2. Use laughter emojis or conversational laughter (e.g., 😂, "haha").
3. Make it feel very human, warm, and authentic.
4. IMPORTANT: NEVER agree to a price below 2000 KSH for any item. 2000 KSH is your absolute floor. Be firm but polite if they try to go below this.`,
        published: true,
        category: "System Prompts",
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
