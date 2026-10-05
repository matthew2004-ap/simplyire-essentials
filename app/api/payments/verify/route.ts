import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const reference =
      searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment reference is required.",
        },
        { status: 400 }
      );
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    // Ask Paystack for the real transaction status
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${secretKey}`,
        },

        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          success: false,
          message:
            data.message ||
            "Payment verification failed.",
        },
        { status: 400 }
      );
    }

    const transaction =
      data.data;

    // Payment must actually be successful
    if (transaction.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          paid: false,
          status: transaction.status,
          message:
            "Payment has not been completed.",
        },
        { status: 400 }
      );
    }

    // Get our order ID from Paystack metadata
    const orderId =
      transaction.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment is valid, but the order could not be identified.",
        },
        { status: 400 }
      );
    }

    // Find the order
    const order =
      await db.order.findUnique({
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

    // Paystack amount is kobo
    const expectedAmount =
      order.total * 100;

    // Make sure customer paid the correct amount
    if (
      Number(transaction.amount) !==
      expectedAmount
    ) {
      console.error(
        "Payment amount mismatch:",
        {
          orderTotal: expectedAmount,
          paystackAmount:
            transaction.amount,
          orderId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment amount does not match the order.",
        },
        { status: 400 }
      );
    }

    // Update order to PAID
   if (order.status !== "PAID") {
  await db.order.update({
    where: {
      id: order.id,
    },

    data: {
  status: "PAID",
  paymentReference: transaction.reference,
  paymentChannel: transaction.channel,
  paidAt: transaction.paid_at
    ? new Date(transaction.paid_at)
    : new Date(),
},
  });
}

    return NextResponse.json({
      success: true,
      paid: true,

      message:
        "Payment verified successfully.",

      order: {
        id: order.id,
        total: order.total,
        status: "PAID",
      },

      payment: {
  reference: transaction.reference,
  amount: transaction.amount,
  channel: transaction.channel,
  paidAt: transaction.paid_at,
},
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}