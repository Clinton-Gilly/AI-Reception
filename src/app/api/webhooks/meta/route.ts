import { NextResponse } from "next/server";
import { fetchQuery, fetchMutation, fetchAction } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Meta webhook verified");
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verify it's a Meta webhook event
    if (body.object) {
      // Handle WhatsApp/Facebook/Instagram events
      for (const entry of body.entry) {
        // Facebook & Instagram typically use entry.id as the page ID
        let pageId = entry.id;
        let platform = "facebook"; // Default fallback
        
        // Check for WhatsApp messages
        if (entry.changes && entry.changes[0]?.value?.metadata?.phone_number_id) {
          platform = "whatsapp";
          pageId = entry.changes[0].value.metadata.phone_number_id;
        } else if (entry.messaging) {
          // Check if Instagram or Facebook
          // Usually we can deduce from the payload or the integration record
          platform = "facebook"; 
        }

        // Extract the actual message depending on the platform structure
        const messagePayload = entry.changes ? entry.changes[0].value.messages : entry.messaging;

        if (messagePayload && messagePayload.length > 0) {
          // Look up which organization this channel identifier belongs to
          const organizationId = await fetchQuery(api.webhooks.getOrgByChannelId, {
            channelId: pageId,
            platform,
          });

          if (organizationId) {
            // Process the message for this specific organization
            await fetchMutation(api.webhooks.processWebhookMessage, {
              organizationId,
              platform,
              message: messagePayload[0],
            });
            console.log(`Routed message to org ${organizationId}`);

            // If it's a WhatsApp message, send a quick automated reply
            if (platform === "whatsapp" && messagePayload[0].from) {
              await fetchAction(api.webhooks.replyToWhatsApp, {
                organizationId,
                phoneNumberId: pageId,
                toPhoneNumber: messagePayload[0].from,
                messageText: "Hello! This is an automated reply from your AI Agent. Your connection is working perfectly!",
              });
            }
          } else {
            console.log(`No matching organization found for channel ID ${pageId}`);
          }
        }
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Error processing Meta webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
