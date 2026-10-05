"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/utils";

type PaymentResult = {
  success: boolean;
  paid?: boolean;
  status?: string;
  message: string;

  order?: {
    id: string;
    total: number;
    status: string;
  };
};

export default function PaymentCallbackPage() {
  const [result, setResult] =
    useState<PaymentResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function verifyPayment() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const reference =
          params.get("reference");

        if (!reference) {
          setResult({
            success: false,
            message:
              "No payment reference was provided.",
          });

          return;
        }

        const response = await fetch(
          `/api/payments/verify?reference=${encodeURIComponent(
            reference
          )}`,
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        setResult(data);

        if (data.success && data.paid) {
          sessionStorage.setItem(
            "simplyire-payment-success",
            "true"
          );
        }
      } catch (error) {
        console.error(
          "Payment callback error:",
          error
        );

        setResult({
          success: false,
          message:
            "We could not verify your payment.",
        });
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, []);

  // -------------------------------
  // VERIFYING PAYMENT
  // -------------------------------

  if (loading) {
    return (
      <div className="page">
        <section className="section container">
          <div className="order-success">
            <div className="success-icon">
              ...
            </div>

            <span className="eyebrow">
              Payment
            </span>

            <h1>
              Verifying your payment...
            </h1>

            <p>
              Please wait while we confirm
              your transaction.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------
  // PAYMENT FAILED
  // -------------------------------

  if (!result?.success || !result.paid) {
    return (
      <div className="page">
        <section className="section container">
          <div className="order-success">
            <div className="success-icon">
              !
            </div>

            <span className="eyebrow">
              Payment
            </span>

            <h1>
              Payment not confirmed
            </h1>

            <p>
              {result?.message ||
                "Your payment could not be confirmed."}
            </p>

            <div className="order-success-actions">
              <Link
                href="/cart"
                className="btn btn-primary"
              >
                Return to Cart
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

  // -------------------------------
  // PAYMENT SUCCESSFUL
  // -------------------------------

  return (
    <div className="page">
      <section className="section container">
        <div className="order-success">
          <div className="success-icon">
            ✓
          </div>

          <span className="eyebrow">
            Payment successful
          </span>

          <h1>
            Thank you for your order! 💗
          </h1>

          <p>
            Your payment has been verified and
            your order is now confirmed.
          </p>

          {result.order && (
            <div className="order-success-card">
              <div>
                <span>Order number</span>

                <strong>
                  {result.order.id}
                </strong>
              </div>

              <div>
                <span>Total paid</span>

                <strong>
                  {formatNaira(
                    result.order.total
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  PAID
                </strong>
              </div>
            </div>
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