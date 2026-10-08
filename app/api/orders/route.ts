import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type OrderRequest = {
  customer: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItemInput[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequest;

    const {
      customer,
      email,
      phone,
      address,
      items,
    } = body;

    const session = await getSession();

    // --------------------------------------------------
    // 1. BASIC VALIDATION
    // --------------------------------------------------

    if (
      !customer?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !address?.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide all required information.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. VALIDATE CART ITEMS
    // --------------------------------------------------

    for (const item of items) {
      if (
        !item.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid product quantity.",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // 3. PREVENT DUPLICATE PRODUCTS
    // --------------------------------------------------

    const productIds = items.map(
      (item) => item.productId
    );

    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Duplicate products were found in the cart.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. CREATE ORDER INSIDE A TRANSACTION
    // --------------------------------------------------

    const order = await db.$transaction(
      async (tx) => {
        // Get products directly from PostgreSQL.
        // Never trust product price or stock from the browser.
        const products = await tx.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
        });

        // --------------------------------------------------
        // 5. CHECK THAT ALL PRODUCTS EXIST
        // --------------------------------------------------

        if (products.length !== productIds.length) {
          throw new Error(
            "One or more products are no longer available."
          );
        }

        let subtotal = 0;

        // --------------------------------------------------
        // 6. BUILD ORDER ITEMS
        // --------------------------------------------------

        const orderItems = items.map((item) => {
          const product = products.find(
            (product) => product.id === item.productId
          );

          if (!product) {
            throw new Error(
              "A product could not be found."
            );
          }

          // Check stock from PostgreSQL.
          if (product.stock < item.quantity) {
            throw new Error(
              `${product.name} does not have enough stock. Only ${product.stock} is available.`
            );
          }

          // Use database price.
          subtotal +=
            product.price * item.quantity;

          return {
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
          };
        });

        // --------------------------------------------------
        // 7. CALCULATE DELIVERY
        // --------------------------------------------------

        const deliveryFee =
          subtotal >= 50000 ? 0 : 2500;

        const total = subtotal + deliveryFee;

        // --------------------------------------------------
        // 8. CREATE ORDER
        // --------------------------------------------------

       const createdOrder = await tx.order.create({
     data: {
    customer: customer.trim(),
    email: email.trim(),
    phone: phone.trim(),
    address: address.trim(),
    status: "PENDING",
    fulfillmentStatus: "PENDING",
    total,
    userId: session?.userId ?? null,

            orderItems: {
              create: orderItems,
            },
          },
          include: {
            orderItems: true,
          },
        });

        // --------------------------------------------------
        // 9. REDUCE STOCK
        // --------------------------------------------------

        for (const item of items) {
          const result =
            await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

          if (result.count !== 1) {
            throw new Error(
              "Stock changed while placing the order. Please try again."
            );
          }
        }

        // --------------------------------------------------
        // 10. RETURN CREATED ORDER
        // --------------------------------------------------

        return createdOrder;
      },

      // --------------------------------------------------
      // TRANSACTION SETTINGS
      // --------------------------------------------------
      {
        maxWait: 20000,
        timeout: 30000,
      }
    );

    // --------------------------------------------------
    // 11. SUCCESS RESPONSE
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully.",
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Order creation error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to create order.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}