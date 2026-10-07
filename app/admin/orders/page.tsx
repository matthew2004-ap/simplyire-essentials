"use client";

import { useEffect, useMemo, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    image: string;
  };
};

type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  fulfillmentStatus: string;
  total: number;
  paymentReference: string | null;
  paymentChannel: string | null;
  paidAt: string | null;
  createdAt: string;
  orderItems: OrderItem[];
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getPaymentClass(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
      return "admin-status admin-status-paid";

    case "PENDING":
      return "admin-status admin-status-pending";

    case "FAILED":
      return "admin-status admin-status-cancelled";

    case "REFUNDED":
      return "admin-status admin-status-cancelled";

    default:
      return "admin-status";
  }
}

function getFulfillmentClass(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
      return "admin-status admin-status-pending";

    case "PROCESSING":
      return "admin-status admin-status-processing";

    case "SHIPPED":
      return "admin-status admin-status-shipped";

    case "DELIVERED":
      return "admin-status admin-status-delivered";

    case "CANCELLED":
      return "admin-status admin-status-cancelled";

    default:
      return "admin-status";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load orders."
        );
      }

      setOrders(data.orders);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.customer.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query);

      const matchesFilter =
        filter === "ALL" ||
        order.status === filter ||
        order.fulfillmentStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter]);

  return (
    <div className="admin-page">
      <section className="admin-header">
        <div className="container">
          <div className="admin-header-content">
            <div>
              <span className="eyebrow">
                Administration
              </span>

              <h1>Order Management</h1>

              <p>
                View customer orders, payments and
                fulfillment information.
              </p>
            </div>

            <div className="admin-header-badge">
              <span>{orders.length} ORDERS</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <span className="eyebrow">Sales</span>
              <h2>Customer Orders</h2>
            </div>

            <button
              type="button"
              className="admin-panel-link"
              onClick={loadOrders}
            >
              Refresh ↻
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1fr) 180px",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <input
              type="search"
              placeholder="Search customer, email or order ID..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="admin-search-input"
            />

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
              className="admin-search-input"
            >
              <option value="ALL">
                All Orders
              </option>
              <option value="PAID">
                Paid
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="PROCESSING">
                Processing
              </option>
              <option value="SHIPPED">
                Shipped
              </option>
              <option value="DELIVERED">
                Delivered
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>

          {loading ? (
            <div className="admin-empty">
              <span>⏳</span>
              <h3>Loading orders...</h3>
              <p>
                Please wait while we retrieve the
                latest orders.
              </p>
            </div>
          ) : error ? (
            <div className="admin-empty">
              <span>⚠️</span>
              <h3>Unable to load orders</h3>
              <p>{error}</p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={loadOrders}
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="admin-empty">
              <span>🛒</span>
              <h3>No matching orders</h3>
              <p>
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Fulfillment</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="admin-customer">
                          <strong>
                            {order.customer}
                          </strong>

                          <span>
                            {order.email}
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong>
                          {formatNaira(order.total)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={getPaymentClass(
                            order.status
                          )}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getFulfillmentClass(
                            order.fulfillmentStatus
                          )}
                        >
                          {order.fulfillmentStatus}
                        </span>
                      </td>

                      <td>
                        {formatDate(order.createdAt)}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-panel-link"
                          onClick={() =>
                            setSelectedOrder(order)
                          }
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {selectedOrder && (
        <div
          className="admin-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >
          <div
            className="admin-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-modal-header">
              <div>
                <span className="eyebrow">
                  Order Details
                </span>

                <h2>
                  {selectedOrder.customer}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                ×
              </button>
            </div>

            <div className="admin-order-details">
              <div className="admin-order-info-grid">
                <div>
                  <span>Order ID</span>
                  <strong>
                    {selectedOrder.id}
                  </strong>
                </div>

                <div>
                  <span>Customer</span>
                  <strong>
                    {selectedOrder.customer}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {selectedOrder.email}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {selectedOrder.phone}
                  </strong>
                </div>

                <div>
                  <span>Payment</span>
                  <strong>
                    {selectedOrder.status}
                  </strong>
                </div>

                <div>
                  <span>Fulfillment</span>
                  <strong>
                    {selectedOrder.fulfillmentStatus}
                  </strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>
                    {formatNaira(
                      selectedOrder.total
                    )}
                  </strong>
                </div>

                <div>
                  <span>Order Date</span>
                  <strong>
                    {formatDate(
                      selectedOrder.createdAt
                    )}
                  </strong>
                </div>
              </div>

              <div className="admin-order-address">
                <span>Delivery Address</span>
                <strong>
                  {selectedOrder.address}
                </strong>
              </div>

              <div>
                <span className="eyebrow">
                  Products
                </span>

                <div className="admin-order-items">
                  {selectedOrder.orderItems.map(
                    (item) => (
                      <div
                        className="admin-order-item"
                        key={item.id}
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                        />

                        <div>
                          <strong>
                            {item.product.name}
                          </strong>

                          <span>
                            {item.quantity} ×{" "}
                            {formatNaira(
                              item.price
                            )}
                          </span>
                        </div>

                        <strong>
                          {formatNaira(
                            item.price *
                              item.quantity
                          )}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </div>

              {selectedOrder.paymentReference && (
                <div className="admin-order-payment">
                  <span>
                    Payment Reference
                  </span>

                  <strong>
                    {
                      selectedOrder.paymentReference
                    }
                  </strong>

                  {selectedOrder.paymentChannel && (
                    <small>
                      Channel:{" "}
                      {
                        selectedOrder.paymentChannel
                      }
                    </small>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}