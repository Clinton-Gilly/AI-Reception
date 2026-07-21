import { NextResponse } from "next/server";

const consumerKey = process.env.MPESA_CONSUMER_KEY!;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE!;
const passkey = process.env.MPESA_PASSKEY!;
const callbackUrl = process.env.MPESA_CALLBACK_URL!;
const environment = process.env.MPESA_ENVIRONMENT || "sandbox";

const baseUrl = environment === "production" 
  ? "https://api.safaricom.co.ke" 
  : "https://sandbox.safaricom.co.ke";

async function getAccessToken() {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  
  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("M-Pesa Auth Error:", err);
    throw new Error("Failed to authenticate with M-Pesa");
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, amount, accountReference = "AI Receptionist", transactionDesc = "Payment" } = body;

    if (!phone || !amount) {
      return NextResponse.json({ error: "Phone and amount are required" }, { status: 400 });
    }

    // Format phone to 254XXXXXXXXX
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }
    
    if (!formattedPhone.startsWith("254") || formattedPhone.length !== 12) {
       return NextResponse.json({ error: "Invalid Safaricom phone number format" }, { status: 400 });
    }

    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
      
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount), // M-Pesa amounts must be integers
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.substring(0, 12),
      TransactionDesc: transactionDesc,
    };

    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("M-Pesa STK Push Error:", err);
      return NextResponse.json({ error: "Failed to initiate STK push" }, { status: response.status });
    }

    const data = await response.json();
    
    if (data.ResponseCode === "0") {
      return NextResponse.json({
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
        customerMessage: data.CustomerMessage,
      });
    } else {
      return NextResponse.json({ error: data.errorMessage || "Failed to initiate STK push" }, { status: 400 });
    }

  } catch (error) {
    console.error("STK Push Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
