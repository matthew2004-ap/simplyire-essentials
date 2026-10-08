import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  releaseOrderReservation,
  settlePaidOrder,
} from "@/lib/order-inventory";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request
) {
  try {
    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "CRON_SECRET is missing."
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Cron service is not configured.",
        },
        { status: 500 }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const now = new Date();

    /*
      Find orders whose inventory reservation
      has expired and is still marked RESERVED.
    */
    const expiredOrders =
      await db.order.findMany({
        where: {
          inventoryStatus: "RESERVED",

          reservationExpiresAt: {
            not: null,
            lte: now,
          },
        },

        orderBy: {
          reservationExpiresAt:
            "asc",
        },

        take: 100,

        select: {
          id: true,
          status: true,
          total: true,
          paymentReference: true,
          reservationExpiresAt: true,
        },
      });

    let released = 0;
    let committed = 0;
    let stillPending = 0;
    let failed = 0;

    const results: Array<{
      orderId: string;
      action: string;
    }> = [];

    const paystackSecret =
      process.env.PAYSTACK_SECRET_KEY;

    for (const order of expiredOrders) {
      try {
        /*
          If Paystack was never initialized,
          there is nothing to verify.
          Release the reservation immediately.
        */
        if (!order.paymentReference) {
          await releaseOrderReservation(
            order.id
          );

          released++;

          results.push({
            orderId: order.id,
            action:
              "RELEASED_NO_PAYMENT_REFERENCE",
          });

          continue;
        }

        if (!paystackSecret) {
          throw new Error(
            "PAYSTACK_SECRET_KEY is not configured."
          );
        }

        /*
          Check Paystack directly before releasing
          the inventory.

          This protects against a legitimate payment
          whose webhook/callback arrived late.
        */
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(
            order.paymentReference
          )}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${paystackSecret}`,
            },

            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.status ||
          !data.data
        ) {
          throw new Error(
            data.message ||
              "Unable to verify Paystack transaction."
          );
        }

        const transaction =
          data.data;

        /*
          Successful payment:
          commit the reserved inventory.
        */
        if (
          transaction.status ===
          "success"
        ) {
          const expectedAmount =
            order.total * 100;

          if (
            Number(
              transaction.amount
            ) !== expectedAmount
          ) {
            throw new Error(
              "Paystack amount does not match the order."
            );
          }

          const metadataOrderId =
            transaction.metadata
              ?.orderId;

          if (
            String(
              metadataOrderId
            ) !== order.id
          ) {
            throw new Error(
              "Paystack metadata does not match the order."
            );
          }

          const paidOrder =
            await settlePaidOrder(
              order.id,
              {
                reference:
                  transaction.reference,

                channel:
                  transaction.channel,

                paidAt:
                  transaction.paid_at,
              }
            );

          /*
            It is now PAID + COMMITTED.
          */
          if (
            paidOrder.status ===
              "PAID" &&
            paidOrder.inventoryStatus ===
              "COMMITTED"
          ) {
            committed++;

            results.push({
              orderId: order.id,
              action:
                "PAYMENT_FOUND_AND_INVENTORY_COMMITTED",
            });
          }

          continue;
        }

        /*
          Explicitly failed or abandoned payments
          can have their reservations released.
        */
        if (
          transaction.status ===
            "failed" ||
          transaction.status ===
            "abandoned"
        ) {
          await releaseOrderReservation(
            order.id
          );

          released++;

          results.push({
            orderId: order.id,
            action:
              "RELEASED_FAILED_PAYMENT",
          });

          continue;
        }

        /*
          Payment may still be processing.
          Keep the reservation and allow the next
          cron run to check again.
        */
        stillPending++;

        results.push({
          orderId: order.id,
          action:
            `STILL_${String(
              transaction.status
            ).toUpperCase()}`,
        });
      } catch (orderError) {
        failed++;

        console.error(
          `Failed to process expired order ${order.id}:`,
          orderError
        );

        results.push({
          orderId: order.id,
          action: "ERROR",
        });
      }
    }

    console.log(
      "Expired inventory cleanup:",
      {
        scanned:
          expiredOrders.length,
        released,
        committed,
        stillPending,
        failed,
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "Expired order cleanup completed.",

      summary: {
        scanned:
          expiredOrders.length,
        released,
        committed,
        stillPending,
        failed,
      },

      results,
    });
  } catch (error) {
    console.error(
      "Expired order cleanup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Cleanup failed.",
      },
      { status: 500 }
    );
  }
}