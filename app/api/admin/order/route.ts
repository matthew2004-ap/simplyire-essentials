import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // ----------------------------------------
    // 1. Authentication
    // ----------------------------------------

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // ----------------------------------------
    // 2. Admin authorization
    // ----------------------------------------

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin access required.",
        },
        { status: 403 }
      );
    }

    // ----------------------------------------
    // 3. Get orders
    // ----------------------------------------

    const orders = await db.order.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // ----------------------------------------
    // 4. Return orders
    // ----------------------------------------

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Admin orders error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load orders.",
      },
      { status: 500 }
    );
  }
}