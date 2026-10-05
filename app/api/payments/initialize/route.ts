import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type PaymentRequest = {
  orderId: string;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as PaymentRequest;

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    // Find the order in PostgreSQL
    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    // Don't pay for an already-paid order
    if (order.status === "PAID") {
      return NextResponse.json(
        {
          success: false,
          message: "This order has already been paid for.",
        },
        { status: 400 }
      );
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    const siteUrl =
      process.env.SITE_URL ||
      "http://localhost:3001";

    // Paystack uses kobo.
    // ₦10,000 = 1,000,000 kobo
    const amountInKobo =
      order.total * 100;

    // Create a unique payment reference
    const reference =
      `SIMPLYIRE-${order.id}-${Date.now()}`;

    const paystackResponse =
      await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: order.email,
            amount: String(amountInKobo),
            currency: "NGN",
            reference,

            callback_url:
              `${siteUrl}/payment/callback`,

            metadata: {
              orderId: order.id,
              customer: order.customer,
              phone: order.phone,
            },
          }),
        }
      );

    const paystackData =
      await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      !paystackData.status
    ) {
      console.error(
        "Paystack initialization failed:",
        paystackData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            paystackData.message ||
            "Unable to initialize payment.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Payment initialized successfully.",

      payment: {
        authorizationUrl:
          paystackData.data.authorization_url,

        accessCode:
          paystackData.data.access_code,

        reference:
          paystackData.data.reference,
      },
    });
  } catch (error) {
    console.error(
      "Payment initialization error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to initialize payment.",
      },
      { status: 500 }
    );
  }
}