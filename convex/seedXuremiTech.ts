import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { DEFAULT_TERMINOLOGY, defaultSiteConfig } from "./lib/defaults";
import {
  DAY_MS,
  addLocalDays,
  dayOfWeek,
  localDateStringAt,
  parseLocalDate,
  zonedDateTimeToUtc,
} from "./lib/time";

export default internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find the Xuremi Tech org
    const organization = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Xuremi Tech"))
      .first();

    if (!organization) {
      throw new Error("Could not find an organization named 'Xuremi Tech'");
    }

    const organizationId = organization._id;
    const { currency, timezone } = organization;

    // 1. Delete existing data for this org to wipe the barber data
    const existingOfferings = await ctx.db.query("offerings").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingOfferings) await ctx.db.delete(doc._id);

    const existingTeamMembers = await ctx.db.query("teamMembers").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingTeamMembers) await ctx.db.delete(doc._id);

    const existingAvailabilityRules = await ctx.db.query("availabilityRules").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingAvailabilityRules) await ctx.db.delete(doc._id);

    const existingContacts = await ctx.db.query("contacts").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingContacts) await ctx.db.delete(doc._id);

    const existingBookings = await ctx.db.query("bookings").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingBookings) await ctx.db.delete(doc._id);

    const existingKnowledge = await ctx.db.query("knowledgeItems").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingKnowledge) await ctx.db.delete(doc._id);

    const existingConversations = await ctx.db.query("conversations").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).collect();
    for (const doc of existingConversations) await ctx.db.delete(doc._id);

    // 2. Patch organization terminology
    const now = Date.now();
    await ctx.db.patch(organizationId, {
      terminology: {
        ...DEFAULT_TERMINOLOGY,
        teamMemberSingular: "Expert",
        teamMemberPlural: "Experts",
        offeringSingular: "Service",
        offeringPlural: "Services",
      },
      updatedAt: now,
    });

    // 3. Setup site config
    const existingSite = await ctx.db.query("publicSites").withIndex("by_organization", (q) => q.eq("organizationId", organizationId)).unique();
    if (!existingSite) throw new Error("Missing public site for Xuremi Tech");

    const siteConfig = {
      ...defaultSiteConfig("Xuremi Tech"),
      headline: "Next-gen tech solutions.",
      subheadline:
        "Expert consulting, architecture reviews, and technical support on demand.",
      about:
        "Xuremi Tech provides high-tier software consulting, architecture design, and system debugging. Book a session with one of our specialists to accelerate your engineering goals.",
      announcement: "Ask our AI concierge to help you find the right expert.",
      contact: {
        email: "support@xuremitech.com",
        address: "Nairobi, Kenya",
        mapUrl: "https://maps.google.com/?q=Nairobi+Kenya",
      },
      agent: {
        showWebChat: true,
        showVoiceChat: true,
        showElevenLabsWidget: false,
        welcomeMessage:
          "Welcome to Xuremi Tech. How can I assist you with your technical needs today?",
      },
    } as const;
    
    const publicSiteId: Id<"publicSites"> = existingSite._id;
    await ctx.db.patch(publicSiteId, {
      draft: siteConfig,
      published: siteConfig,
      publishedAt: now,
      updatedAt: now,
    });

    // 4. Offerings
    const offerings = [
      {
        name: "IT Consultation",
        slug: "it-consultation",
        description: "A comprehensive session to discuss your technical needs, infrastructure, and potential solutions.",
        category: "Consulting",
        durationMinutes: 30,
        bufferBeforeMinutes: 5,
        bufferAfterMinutes: 10,
        priceMinor: 5_000,
      },
      {
        name: "Technical Support",
        slug: "technical-support",
        description: "Live debugging and support for your critical applications.",
        category: "Support",
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 15,
        priceMinor: 8_500,
      },
      {
        name: "Architecture Review",
        slug: "architecture-review",
        description: "Deep dive into your system architecture to identify bottlenecks and scale efficiently.",
        category: "Engineering",
        durationMinutes: 120,
        bufferBeforeMinutes: 15,
        bufferAfterMinutes: 15,
        priceMinor: 20_000,
      },
      {
        name: "Pair Programming",
        slug: "pair-programming",
        description: "One-on-one code review and pair programming session.",
        category: "Engineering",
        durationMinutes: 60,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 10,
        priceMinor: 10_000,
      },
    ];
    const offeringIds: Id<"offerings">[] = [];
    for (const offering of offerings) {
      offeringIds.push(
        await ctx.db.insert("offerings", {
          organizationId,
          ...offering,
          currency,
          capacity: 1,
          active: true,
          bookableOnline: true,
          createdAt: now,
          updatedAt: now,
        }),
      );
    }

    // 5. Team Members
    const memberSeeds = [
      {
        name: "Alex Mercer",
        title: "Senior Solutions Architect",
        bio: "Specializes in scalable cloud architectures and distributed systems.",
      },
      {
        name: "Jamie Lin",
        title: "Technical Support Specialist",
        bio: "Expert in rapid debugging, incident response, and performance tuning.",
      },
      {
        name: "Sam Rivera",
        title: "Lead Developer",
        bio: "Focuses on modern web development, code reviews, and mentoring.",
      },
    ];
    const memberIds: Id<"teamMembers">[] = [];
    for (let index = 0; index < memberSeeds.length; index += 1) {
      memberIds.push(
        await ctx.db.insert("teamMembers", {
          organizationId,
          ...memberSeeds[index],
          offeringIds,
          active: true,
          acceptingBookings: true,
          sortOrder: index,
          createdAt: now,
          updatedAt: now,
        }),
      );
    }

    for (const teamMemberId of memberIds) {
      for (let weekday = 1; weekday <= 5; weekday += 1) {
        await ctx.db.insert("availabilityRules", {
          organizationId,
          teamMemberId,
          timezone,
          dayOfWeek: weekday,
          startMinute: 9 * 60, // 9 AM
          endMinute: 18 * 60,  // 6 PM
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 6. Contacts
    const contactSeeds = [
      ["David Chen", "david.c@startup.example", "+254 700 000001"],
      ["Sarah Jenkins", "sarah@enterprise.example", "+254 700 000002"],
      ["Michael Ross", "michael@agency.example", "+254 700 000003"],
      ["Emily Wong", "emily.w@tech.example", "+254 700 000004"],
      ["Omar Hassan", "omar.h@logistics.example", "+254 700 000005"],
      ["Lisa Ray", "lisa.ray@fintech.example", "+254 700 000006"],
    ] as const;
    const contactIds: Id<"contacts">[] = [];
    for (const [name, email, phone] of contactSeeds) {
      contactIds.push(
        await ctx.db.insert("contacts", {
          organizationId,
          name,
          email,
          emailNormalized: email,
          phone,
          phoneNormalized: phone.replace(/[^\d+]/g, ""),
          tags: ["tech-demo"],
          createdAt: now,
          updatedAt: now,
        }),
      );
    }

    // 7. Bookings
    const today = parseLocalDate(localDateStringAt(now, timezone));
    const futureDates: typeof today[] = [];
    for (let offset = 1; futureDates.length < 5 && offset < 10; offset += 1) {
      const date = addLocalDays(today, offset);
      if (dayOfWeek(date) !== 0 && dayOfWeek(date) !== 6) futureDates.push(date); // M-F
    }
    let bookingCount = 0;
    for (let dayIndex = 0; dayIndex < futureDates.length; dayIndex += 1) {
      for (let memberIndex = 0; memberIndex < memberIds.length; memberIndex += 1) {
        const offeringIndex = (dayIndex + memberIndex) % offeringIds.length;
        const offering = offerings[offeringIndex];
        const startAt = zonedDateTimeToUtc(
          {
            ...futureDates[dayIndex],
            hour: 10 + memberIndex * 2,
            minute: dayIndex % 2 === 0 ? 0 : 30,
          },
          timezone,
        );
        if (startAt === null) continue;
        const endAt = startAt + offering.durationMinutes * 60_000;
        const contactIndex = bookingCount % contactIds.length;
        const member = memberSeeds[memberIndex];
        const contact = contactSeeds[contactIndex];
        await ctx.db.insert("bookings", {
          organizationId,
          publicSiteId,
          contactId: contactIds[contactIndex],
          offeringId: offeringIds[offeringIndex],
          teamMemberId: memberIds[memberIndex],
          startAt,
          endAt,
          reservedStartAt: startAt - offering.bufferBeforeMinutes * 60_000,
          reservedEndAt: endAt + offering.bufferAfterMinutes * 60_000,
          status: "confirmed",
          source: bookingCount % 3 === 0 ? "web_agent" : "public_site",
          confirmationCode: `XUREMI-${String(bookingCount + 1).padStart(3, "0")}`,
          idempotencyKey: `seed-xuremi-${bookingCount + 1}`,
          idempotencyFingerprint: `seed-${bookingCount + 1}`,
          offeringSnapshot: {
            name: offering.name,
            durationMinutes: offering.durationMinutes,
            priceMinor: offering.priceMinor,
            currency,
          },
          teamMemberSnapshot: { name: member.name, title: member.title },
          customerSnapshot: {
            name: contact[0],
            email: contact[1],
            phone: contact[2],
          },
          createdAt: now - DAY_MS,
          updatedAt: now - DAY_MS,
        });
        bookingCount += 1;
      }
    }

    // 8. Knowledge Items
    const knowledgeItems = [
      ["What are your support hours?", "Our core team is available Monday to Friday, 9 AM to 6 PM EAT.", "Support"],
      ["Do you offer emergency technical support?", "Yes, for our enterprise clients we have a 24/7 SLA. Please use the emergency contact number in your contract.", "Support"],
      ["Where are you located?", "We operate globally with a fully remote team, while our HQ is located in Nairobi, Kenya.", "About"],
      ["Cancellation Policy", "Please provide at least 24 hours notice for any consultation or pair programming session cancellations.", "Policy"],
      ["What technologies do you specialize in?", "We specialize in modern web stacks including React, Next.js, Node.js, and scalable cloud architectures on AWS and GCP.", "Expertise"],
    ] as const;
    for (let index = 0; index < knowledgeItems.length; index += 1) {
      const [title, content, category] = knowledgeItems[index];
      await ctx.db.insert("knowledgeItems", {
        organizationId,
        title,
        content,
        category,
        published: true,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 9. Conversations
    const conversations = [
      {
        externalConversationId: "tech-web-001",
        channel: "web" as const,
        summary: "Client inquired about setting up a scalable backend. Recommended an Architecture Review with Alex Mercer.",
        durationSeconds: 240,
        outcome: "booking_created",
      },
      {
        externalConversationId: "tech-web-002",
        channel: "web" as const,
        summary: "Helped a user troubleshoot a minor bug and suggested a Technical Support session with Jamie Lin.",
        durationSeconds: 180,
        outcome: "booking_created",
      },
      {
        externalConversationId: "tech-web-003",
        channel: "web" as const,
        summary: "Answered questions about the tech stack expertise and location. No booking requested.",
        durationSeconds: 95,
        outcome: "question_answered",
      },
    ];
    for (let index = 0; index < conversations.length; index += 1) {
      await ctx.db.insert("conversations", {
        organizationId,
        ...conversations[index],
        status: "completed",
        startedAt: now - (index + 1) * 3 * 60 * 60 * 1_000,
        endedAt: now - (index + 1) * 3 * 60 * 60 * 1_000 + conversations[index].durationSeconds * 1_000,
        createdAt: now - (index + 1) * 3 * 60 * 60 * 1_000,
        updatedAt: now - (index + 1) * 3 * 60 * 60 * 1_000,
      });
    }

    return {
      organizationId,
      clerkOrgId: organization.clerkOrgId,
      siteSlug: existingSite.siteSlug,
      offerings: offeringIds.length,
      teamMembers: memberIds.length,
      contacts: contactIds.length,
      bookings: bookingCount,
      created: true,
    };
  },
});
