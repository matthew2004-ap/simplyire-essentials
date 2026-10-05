import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is missing.");

      return NextResponse.json(
        {
          success: false,
          message: "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.text();

    const signature = request.headers.get(
      "x-paystack-signature"
    );

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing Paystack signature.",
        },
        { status: 401 }
      );
    }

    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack webhook signature.");

      return NextResponse.json(
        {
          success: false,
          message: "Invalid signature.",
        },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    console.log("Paystack webhook event:", event.event);

    if (event.event !== "charge.success") {
      return NextResponse.json({
        success: true,
        message: "Event received.",
      });
    }

    const transaction = event.data;

    const orderId = transaction.metadata?.orderId;

    if (!orderId) {
      console.error(
        "Paystack transaction has no order ID."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Order ID missing from transaction.",
        },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      console.error(
        "Order not found:",
        orderId
      );

      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    const expectedAmount = order.total * 100;

    if (
      Number(transaction.amount) !==
      expectedAmount
    ) {
      console.error(
        "Payment amount mismatch.",
        {
          orderId,
          expectedAmount,
          receivedAmount: transaction.amount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    if (transaction.status !== "success") {
      return NextResponse.json({
        success: true,
        message: "Payment is not successful.",
      });
    }

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

    console.log(
      `Order ${order.id} marked as PAID.`
    );

    return NextResponse.json({
      success: true,
      message: "Payment webhook processed successfully.",
    });
  } catch (error) {
    console.error(
      "Paystack webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}