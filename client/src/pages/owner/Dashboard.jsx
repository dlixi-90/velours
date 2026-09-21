import { useCallback, useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import { formatThousandsVnd } from "../../utils/money";
import { usePopularProducts } from "../../hooks/usePopularProducts";

const ORDER_STATUSES = ["Order Placed", "Packing", "Shipping", "Delivery"];

const buildMonthlyData = (orders) => {
  const latestOrderTimestamp = orders.reduce((latestTimestamp, order) => {
    const orderTimestamp = new Date(order.createdAt).getTime();

    return Number.isNaN(orderTimestamp)
      ? latestTimestamp
      : Math.max(latestTimestamp, orderTimestamp);
  }, 0);
  const anchorDate = latestOrderTimestamp
    ? new Date(latestOrderTimestamp)
    : new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() - 5 + index,
      1,
    );

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleDateString("en-US", { month: "short" }),
      total: 0,
      successful: 0,
    };
  });
  const monthsByKey = new Map(months.map((month) => [month.key, month]));

  orders.forEach((order) => {
    const createdAt = new Date(order.createdAt);

    if (Number.isNaN(createdAt.getTime())) return;

    const month = monthsByKey.get(
      `${createdAt.getFullYear()}-${createdAt.getMonth()}`,
    );

    if (!month) return;

    const amount = Number(order.amount) || 0;
    month.total += amount;

    if (order.isPaid) {
      month.successful += amount;
    }
  });

  return months;
};

const Dashboard = () => {
  const { user, currency, axios, getToken } = useAppContext();
  const {
    popularProducts,
    popularProductsLoading,
    popularProductsError,
    fetchPopularProducts,
  } = usePopularProducts();
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    totalOrders: 0,
    totalRevenue: 0,
  });

  const requestDashboardData = useCallback(async () => {
    const { data } = await axios.get("/api/orders/", {
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

    if (!data.success) {
      throw new Error(data.message || "Unable to load dashboard data");
    }

    return data.dashboardData;
  }, [axios, getToken]);

  const getDashboardData = async () => {
    try {
      setDashboardData(await requestDashboardData());
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const { data } = await axios.post(
        "/api/orders/status",
        { orderId, status: event.target.value },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        },
      );

      if (data.success) {
        await Promise.all([getDashboardData(), fetchPopularProducts()]);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!user) return undefined;

    let isActive = true;

    requestDashboardData()
      .then((nextDashboardData) => {
        if (isActive) {
          setDashboardData(nextDashboardData);
        }
      })
      .catch((error) => {
        if (isActive) {
          toast.error(error.message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [requestDashboardData, user]);

  const orders = useMemo(
    () => dashboardData.orders || [],
    [dashboardData.orders],
  );
  const monthlyData = useMemo(() => buildMonthlyData(orders), [orders]);

  return (
    <main className="m-1 h-[97vh] overflow-y-auto rounded-xl bg-primary px-3 py-6 shadow sm:m-3 sm:px-5 md:px-8 lg:w-11/12 xl:py-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#e1e6e3] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6f9a79]">
              Overview
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[#263b4a] sm:text-3xl">
              Dashboard
            </h1>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <DashboardCard className="xl:col-span-2">
            <div className="flex w-full items-center justify-between gap-3">
              <h2 className="text-lg font-medium text-[#263b4a]">
                Total Revenue
              </h2>

              <p className="text-xl font-medium text-black">
                {formatThousandsVnd(dashboardData.totalRevenue || 0, currency)}
              </p>
            </div>
            <div className="mt-4 h-[360px] min-h-[360px] min-w-0 w-full">
              <ResponsiveContainer width="100%" height={360} minWidth={0}>
                <BarChart data={monthlyData}>
                  <CartesianGrid vertical={false} stroke="#e9edef" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#7d8792", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#7d8792", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => formatThousandsVnd(value, currency)}
                    cursor={{ fill: "#f4f6f5" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#9fc4a9"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="successful"
                    name="Paid"
                    fill="#263b4a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard>
            <CardTitle title="Popular Products" />
            <p className="mt-2 text-xs text-[#8b949c]">Top 4 by units sold · All time</p>
            {popularProductsError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {popularProductsError}{" "}
                <button type="button" onClick={fetchPopularProducts} className="underline">
                  Retry
                </button>
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              {popularProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#edf0f2] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f2f5f3]">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package size={16} className="text-[#8b949c]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#263b4a]">
                        {product.title}
                      </p>
                      <p className="text-xs text-[#8b949c]">
                        {product.soldQuantity} sold
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {popularProductsLoading && <p role="status">Loading popular products...</p>}
              {!popularProductsLoading && !popularProductsError && !popularProducts.length && (
                <EmptyState text="No sales yet" />
              )}
            </div>
          </DashboardCard>
        </div>

        <section className="mt-4 rounded-xl border border-[#e2e7eb] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#edf0f2] pb-4">
            <div>
              <h2 className="text-lg font-medium text-[#263b4a]">
                All Orders / Sales
              </h2>
            </div>
            <span className="rounded-full bg-[#edf5ef] px-3 py-1 text-xs font-medium text-[#50745a]">
              {dashboardData.totalOrders || 0} total
            </span>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                currency={currency}
                onStatusChange={statusHandler}
              />
            ))}
            {!orders.length && <EmptyState text="No orders found" />}
          </div>
        </section>
      </div>
    </main>
  );
};

const OrderCard = ({ order, currency, onStatusChange }) => {
  const address = order.address || {};
  const items = order.items || [];
  const customerName = [address.firstName, address.lastName]
    .filter(Boolean)
    .join(" ");
  const fullAddress = [
    address.street,
    address.state,
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
  const zipcode = address.zipcode || address.zipCode || "—";
  const createdAt = new Date(order.createdAt);
  const formattedDate = Number.isNaN(createdAt.getTime())
    ? "—"
    : createdAt.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  return (
    <article className="overflow-hidden rounded-xl border border-[#e2e7eb] bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-[#edf0f2] bg-[#fafbfb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b949c]">
            Order
          </p>
          <h3
            className="mt-1 truncate font-mono text-sm font-semibold text-[#263b4a]"
            title={order._id}
          >
            #{String(order._id).slice(-8).toUpperCase()}
          </h3>
          <p className="mt-1 text-xs text-[#8b949c]">
            Placed on {formattedDate}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              order.isPaid
                ? "bg-[#edf6ee] text-[#4f7f5a]"
                : "bg-[#fff5e5] text-[#a26f2c]"
            }`}
          >
            {order.isPaid
              ? "Paid"
              : order.paymentMethod === "COD"
                ? "Pay on delivery"
                : "Pending"}
          </span>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-[#8b949c]">
              Total
            </p>
            <p className="mt-0.5 text-base font-semibold text-[#263b4a]">
              {formatThousandsVnd(order.amount, currency)}
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.75fr)]">
        <section className="p-4 sm:p-5 lg:border-r lg:border-[#edf0f2]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#263b4a]">Products</h4>
            <span className="text-xs text-[#8b949c]">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-3 divide-y divide-[#edf0f2]">
            {items.map((item, index) => {
              const product =
                item.product && typeof item.product === "object"
                  ? item.product
                  : {};
              const productImage = item.image || product.images?.[0];
              const productTitle =
                item.title || product.title || "Unavailable product";

              return (
                <div
                  key={item._id || index}
                  className="flex items-start gap-4 py-3 first:pt-0 last:pb-0"
                >
                  {/* LEFT: Product */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#edf0f2] bg-[#f7f9f8] p-1">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productTitle}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package size={19} className="text-[#8b949c]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#263b4a]">
                        {productTitle}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#69747e]">
                        <span className="rounded-md bg-[#f1f4f2] px-2 py-1">
                          Size: <b className="text-[#263b4a]">{item.size}</b>
                        </span>

                        <span className="rounded-md bg-[#f1f4f2] px-2 py-1">
                          Qty: <b className="text-[#263b4a]">{item.quantity}</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Price */}
                  <div className="shrink-0 pt-0.5 text-right">
                    <p className="whitespace-nowrap text-sm font-semibold leading-5 text-[#263b4a]">
                      {formatThousandsVnd(
                        item.unitPrice ?? product.price?.[item.size] ?? 0,
                        currency,
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="border-t border-[#edf0f2] bg-[#fcfdfc] p-4 sm:p-5 lg:border-t-0">
          <h4 className="text-sm font-semibold text-[#263b4a]">
            Customer details
          </h4>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9aa3aa]">
                Customer
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#263b4a]">
                {customerName || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9aa3aa]">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-[#52616b]">
                {address.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9aa3aa]">
                Shipping address
              </dt>
              <dd className="mt-1 text-sm leading-5 text-[#52616b]">
                {fullAddress || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9aa3aa]">
                ZIP code
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#263b4a]">
                {zipcode}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[#9aa3aa]">
                Payment method
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#263b4a]">
                {order.paymentMethod || "—"}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <footer className="flex flex-col gap-2 border-t border-[#edf0f2] bg-[#fafbfb] px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
        <label
          htmlFor={`status-${order._id}`}
          className="text-xs font-medium text-[#69747e]"
        >
          Order status
        </label>
        <select
          id={`status-${order._id}`}
          onChange={(event) => onStatusChange(event, order._id)}
          value={order.status}
          className="w-full rounded-md border border-[#dfe5e8] bg-white px-3 py-2 text-xs font-semibold text-[#263b4a] outline-none transition focus:border-[#9fc4a9] focus:ring-2 focus:ring-[#dcecdf] sm:w-40"
        >
          {!ORDER_STATUSES.includes(order.status) && (
            <option value={order.status}>{order.status}</option>
          )}
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status === "Delivery" ? "Delivered" : status}
            </option>
          ))}
        </select>
      </footer>
    </article>
  );
};

const DashboardCard = ({ children, className = "" }) => (
  <section
    className={`min-w-0 rounded-xl border border-[#e2e7eb] bg-white p-4 shadow-sm sm:p-5 ${className}`}
  >
    {children}
  </section>
);

const CardTitle = ({ title, description }) => (
  <div>
    <h2 className="text-lg font-medium text-[#263b4a]">{title}</h2>
    {description && (
      <p className="mt-1 text-xs font-medium text-[#8b949c]">{description}</p>
    )}
  </div>
);

const EmptyState = ({ text }) => (
  <div className="py-8 text-center text-sm text-[#8b949c]">{text}</div>
);

export default Dashboard;
