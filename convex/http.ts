import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/mpesa-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      console.log("Received M-Pesa Callback:", JSON.stringify(body, null, 2));

      // M-Pesa structure: Body.stkCallback
      const callbackData = body?.Body?.stkCallback;
      
      if (!callbackData) {
        return new Response("Invalid callback payload", { status: 400 });
      }

      const merchantRequestId = callbackData.MerchantRequestID;
      const checkoutRequestId = callbackData.CheckoutRequestID;
      const resultCode = callbackData.ResultCode;
      const resultDescription = callbackData.ResultDesc;

      let status: "success" | "failed" | "cancelled" = "failed";

      if (resultCode === 0) {
        status = "success";
      } else if (resultCode === 1032) {
        status = "cancelled";
      }

      await ctx.runMutation(api.mpesa.updatePaymentStatus, {
        checkoutRequestId,
        merchantRequestId,
        resultCode,
        resultDescription,
        status,
      });

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing M-Pesa callback:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

export default http;
