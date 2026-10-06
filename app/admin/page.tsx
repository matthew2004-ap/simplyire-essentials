import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusClass(status: string) {
  switch (status.toUpperCase()) {
    case "PAID":
      return "admin-status admin-status-paid";

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

export default async function AdminPage() {
  // ----------------------------------------
  // 1. Check authentication
  // ----------------------------------------

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // ----------------------------------------
  // 2. Check admin permission
  // ----------------------------------------

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // ----------------------------------------
  // 3. Get dashboard data
  // ----------------------------------------

  const [
    revenueResult,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    // Revenue from paid orders only
    db.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        status: "PAID",
      },
    }),

    // Total orders
    db.order.count(),

    // Customers only
    db.user.count({
      where: {
        role: "CUSTOMER",
      },
    }),

    // Products
    db.product.count(),

    // Pending orders
    db.order.count({
      where: {
        status: "PENDING",
      },
    }),

    // Recent orders
    db.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        customer: true,
        email: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),

    // Products with 5 or fewer items
    db.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      orderBy: {
        stock: "asc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        image: true,
      },
    }),
  ]);

  const revenue = revenueResult._sum.total ?? 0;

  // ----------------------------------------
  // 4. Dashboard
  // ----------------------------------------

  return (
    <div className="admin-page">

      {/* ================================
          ADMIN HEADER
      ================================= */}

      <section className="admin-header">
        <div className="container">

          <div className="admin-header-content">

            <div>
              <span className="eyebrow">
                Administration
              </span>

              <h1>
                Welcome, {session.name}.
              </h1>

              <p>
                Manage Simplyire Essentials
                from one place.
              </p>
            </div>

            <div className="admin-header-badge">
              <span>ADMIN</span>
            </div>

          </div>

        </div>
      </section>


      {/* ================================
          STATISTICS
      ================================= */}

      <section className="section container">

        <div className="admin-stats-grid">

          {/* Revenue */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              ₦
            </div>

            <div>
              <span>
                Total Revenue
              </span>

              <strong>
                {formatNaira(revenue)}
              </strong>

              <p>
                From paid orders
              </p>
            </div>

          </div>


          {/* Orders */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              🛒
            </div>

            <div>
              <span>
                Total Orders
              </span>

              <strong>
                {totalOrders}
              </strong>

              <p>
                {pendingOrders} pending
              </p>
            </div>

          </div>


          {/* Customers */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              👥
            </div>

            <div>
              <span>
                Customers
              </span>

              <strong>
                {totalCustomers}
              </strong>

              <p>
                Registered customers
              </p>
            </div>

          </div>


          {/* Products */}

          <div className="admin-stat-card">

            <div className="admin-stat-icon">
              📦
            </div>

            <div>
              <span>
                Products
              </span>

              <strong>
                {totalProducts}
              </strong>

              <p>
                Products in catalog
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* ================================
          MAIN CONTENT
      ================================= */}

      <section className="section container">

        <div className="admin-content-grid">


          {/* ============================
              RECENT ORDERS
          ============================= */}

          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <span className="eyebrow">
                  Sales
                </span>

                <h2>
                  Recent Orders
                </h2>

              </div>

              <a
                href="/admin/orders"
                className="admin-panel-link"
              >
                View all →
              </a>

            </div>


            {recentOrders.length === 0 ? (

              <div className="admin-empty">

                <span>
                  🛒
                </span>

                <h3>
                  No orders yet
                </h3>

                <p>
                  Customer orders will
                  appear here.
                </p>

              </div>

            ) : (

              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>

                    <tr>

                      <th>
                        Customer
                      </th>

                      <th>
                        Total
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Date
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {recentOrders.map(
                      (order) => (

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
                              {formatNaira(
                                order.total
                              )}
                            </strong>

                          </td>


                          <td>

                            <span
                              className={getStatusClass(
                                order.status
                              )}
                            >
                              {order.status}
                            </span>

                          </td>


                          <td>
                            {formatDate(
                              order.createdAt
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>


          {/* ============================
              LOW STOCK
          ============================= */}

          <div className="admin-panel">

            <div className="admin-panel-header">

              <div>

                <span className="eyebrow">
                  Inventory
                </span>

                <h2>
                  Low Stock
                </h2>

              </div>

              <a
                href="/admin/products"
                className="admin-panel-link"
              >
                Products →
              </a>

            </div>


            {lowStockProducts.length === 0 ? (

              <div className="admin-empty">

                <span>
                  ✅
                </span>

                <h3>
                  Stock looks good
                </h3>

                <p>
                  No products are running low.
                </p>

              </div>

            ) : (

              <div className="low-stock-list">

                {lowStockProducts.map(
                  (product) => (

                    <div
                      className="low-stock-item"
                      key={product.id}
                    >

                      <img
                        src={product.image}
                        alt={product.name}
                      />

                      <div className="low-stock-info">

                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {formatNaira(
                            product.price
                          )}
                        </span>

                      </div>

                      <div
                        className={
                          product.stock <= 2
                            ? "stock-danger"
                            : "stock-warning"
                        }
                      >
                        {product.stock} left
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      </section>


      {/* ================================
          QUICK ACTIONS
      ================================= */}

      <section className="section container">

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>

              <span className="eyebrow">
                Management
              </span>

              <h2>
                Quick Actions
              </h2>

            </div>

          </div>


          <div className="admin-actions">

            <a
              href="/admin/orders"
              className="admin-action"
            >

              <span>
                🛒
              </span>

              <div>

                <strong>
                  Manage Orders
                </strong>

                <p>
                  View and update customer
                  orders.
                </p>

              </div>

            </a>


            <a
              href="/admin/products"
              className="admin-action"
            >

              <span>
                📦
              </span>

              <div>

                <strong>
                  Manage Products
                </strong>

                <p>
                  Manage products and inventory.
                </p>

              </div>

            </a>


            <a
              href="/admin/customers"
              className="admin-action"
            >

              <span>
                👥
              </span>

              <div>

                <strong>
                  Customers
                </strong>

                <p>
                  View registered customers.
                </p>

              </div>

            </a>


            <a
              href="/admin/messages"
              className="admin-action"
            >

              <span>
                💬
              </span>

              <div>

                <strong>
                  Messages
                </strong>

                <p>
                  View customer messages.
                </p>

              </div>

            </a>

          </div>

        </div>

      </section>

    </div>
  );
}