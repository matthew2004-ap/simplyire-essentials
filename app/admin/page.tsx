import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Administration
          </span>

          <h1>
            Welcome, {session.name}.
          </h1>

          <p>
            This is your Simplyire
            Essentials admin dashboard.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="dashboard-grid">
          <div className="dash-card">
            <span>Orders</span>
            <strong>0</strong>
            <p>
              Manage customer orders.
            </p>
          </div>

          <div className="dash-card">
            <span>Products</span>
            <strong>0</strong>
            <p>
              Manage your product catalog.
            </p>
          </div>

          <div className="dash-card">
            <span>Customers</span>
            <strong>0</strong>
            <p>
              View registered customers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}