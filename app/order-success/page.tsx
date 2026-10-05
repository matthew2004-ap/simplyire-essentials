"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/utils";

type OrderInfo = {
  orderId: string;
  total: number;
  customer: string;
  email: string;
};

export default function OrderSuccessPage() {
  const [order, setOrder] =
    useState<OrderInfo | null>(null);

  useEffect(() => {
    const savedOrder =
      sessionStorage.getItem(
        "simplyire-last-order"
      );

    if (savedOrder) {
      try {
        setOrder(JSON.parse(savedOrder));
      } catch (error) {
        console.error(
          "Failed to read order information:",
          error
        );
      }
    }
  }, []);

  return (
    <div className="page">
      <section className="section container">
        <div className="order-success">
          <div className="success-icon">✓</div>

          <span className="eyebrow">
            Order received
          </span>

          <h1>Thank you for your order! 💗</h1>

          {order ? (
            <>
              <p>
                Hi {order.customer}, your order has
                been successfully created.
              </p>

              <div className="order-success-card">
                <div>
                  <span>Order number</span>
                  <strong>{order.orderId}</strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>
                    {formatNaira(order.total)}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{order.email}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>Pending</strong>
                </div>
              </div>
            </>
          ) : (
            <p>
              Your order has been received successfully.
            </p>
          )}

          <div className="order-success-actions">
            <Link
              href="/shop"
              className="btn btn-primary"
            >
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="btn btn-secondary"
            >
              Back Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}