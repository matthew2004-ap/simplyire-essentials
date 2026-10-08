import { db } from "@/lib/db";

type PaymentDetails = {
  reference: string;
  channel?: string | null;
  paidAt?: string | null;
};

export async function settlePaidOrder(
  orderId: string,
  payment: PaymentDetails
) {
  return db.$transaction(
    async (tx) => {
      const order =
        await tx.order.findUnique({
          where: {
            id: orderId,
          },
          include: {
            orderItems: true,
          },
        });

      if (!order) {
        throw new Error(
          "Order not found."
        );
      }

      /*
        Already completed.
        This makes the operation idempotent.
      */
      if (order.status === "PAID") {
        return order;
      }

      /*
        New reservation-based orders.
      */
      if (
        order.inventoryStatus ===
        "RESERVED"
      ) {
        for (const item of order.orderItems) {
          const result =
            await tx.$executeRaw`
              UPDATE "Product"
              SET
                "stock" = "stock" - ${item.quantity},
                "reservedStock" = "reservedStock" - ${item.quantity},
                "updatedAt" = NOW()
              WHERE
                "id" = ${item.productId}
                AND "stock" >= ${item.quantity}
                AND "reservedStock" >= ${item.quantity}
            `;

          if (result !== 1) {
            throw new Error(
              "Inventory could not be committed for this order."
            );
          }
        }
      }

      /*
        Legacy orders have inventoryStatus = NONE.
        Their stock was already reduced by the
        previous system, so do not reduce it again.
      */

      const updatedOrder =
        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: "PAID",
            paymentReference:
              payment.reference,
            paymentChannel:
              payment.channel ?? null,
            paidAt: payment.paidAt
              ? new Date(payment.paidAt)
              : new Date(),

            inventoryStatus:
              order.inventoryStatus ===
              "RESERVED"
                ? "COMMITTED"
                : order.inventoryStatus,

            reservationExpiresAt: null,
          },
          include: {
            orderItems: true,
          },
        });

      return updatedOrder;
    },
    {
      maxWait: 20000,
      timeout: 30000,
    }
  );
}

export async function releaseOrderReservation(
  orderId: string
) {
  return db.$transaction(
    async (tx) => {
      const order =
        await tx.order.findUnique({
          where: {
            id: orderId,
          },
          include: {
            orderItems: true,
          },
        });

      if (!order) {
        throw new Error(
          "Order not found."
        );
      }

      /*
        Nothing to release for:
        - old orders
        - already paid orders
        - already released orders
      */
      if (
        order.inventoryStatus !==
        "RESERVED"
      ) {
        return order;
      }

      if (order.status === "PAID") {
        return order;
      }

      for (const item of order.orderItems) {
        const result =
          await tx.$executeRaw`
            UPDATE "Product"
            SET
              "reservedStock" = "reservedStock" - ${item.quantity},
              "updatedAt" = NOW()
            WHERE
              "id" = ${item.productId}
              AND "reservedStock" >= ${item.quantity}
          `;

        if (result !== 1) {
          throw new Error(
            "Reserved inventory could not be released."
          );
        }
      }

      return tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "FAILED",
          inventoryStatus:
            "RELEASED",
          reservationExpiresAt:
            null,
        },
        include: {
          orderItems: true,
        },
      });
    },
    {
      maxWait: 20000,
      timeout: 30000,
    }
  );
}