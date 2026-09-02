import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/data";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user, currency, axios, getToken } = useAppContext();
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    totalOrders: 0,
    totalRevenue: 0,
  });

  const getDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/orders/", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusHandler = async (e, orderId) => {
    try {
      const { data } = await axios.post(
        "/api/orders/status",
        { orderId, status: e.target.value },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        },
      );
      if (data.success) {
        await getDashboardData();
        toast.success(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      getDashboardData();
    }
  }, [user]);

  return (
    <div className="md:px-8 py-6 xl:py-8 m-1 sm:m-3 h-[97vh] overflow-y-scroll lg:w-11/12 bg-primary shadow rounded-xl">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flexStart gap-7 p-5 bg-[#fff4d2] lg:min-w-56 rounded-xl border border-amber-200/50 shadow-sm">
          <img src={assets.graph} alt="" className="hidden sm:flex w-8" />
          <div>
            <h4 className="h4 font-bold text-slate-800">
              {dashboardData?.totalOrders?.toString().padStart(2, "0")}
            </h4>
            <h5 className="h5 text-secondary font-medium">Total Sales</h5>
          </div>
        </div>
        <div className="flexStart gap-7 p-5 bg-[#fff4d2] lg:min-w-56 rounded-xl border border-amber-200/50 shadow-sm">
          <img src={assets.dollar} alt="" className="hidden sm:flex w-8" />
          <div>
            <h4 className="h4 font-bold text-slate-800">
              {dashboardData?.totalRevenue || 0}
              {currency}
            </h4>
            <h5 className="h5 text-secondary font-medium">Total Earning</h5>
          </div>
        </div>
      </div>

      {/* All Orders/Sales */}
      <div className="bg-primary mt-6 space-y-4">
        {dashboardData.orders.map((order) => (
          <div
            key={order._id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md"
          >
            {/* Products List */}
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="text-gray-700 flex flex-col lg:flex-row gap-4 mb-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0"
              >
                <div className="flex flex-[2] gap-x-3 items-center">
                  <div className="flexCenter bg-slate-50 border border-slate-100 rounded-xl p-2 shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="max-h-16 max-w-16 object-contain"
                    />
                  </div>
                  <div className="block w-full">
                    <h5 className="h5 uppercase line-clamp-1 font-semibold text-slate-800">
                      {item.product.title}
                    </h5>
                    <div className="flex flex-wrap gap-4 max-sm:gap-y-1 mt-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-x-1.5">
                        <span className="medium-14 text-slate-500">Price:</span>
                        <span className="font-medium text-slate-800">
                          {item.product.price[item.size]}
                          {currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1.5">
                        <span className="medium-14 text-slate-500">
                          Quantity:
                        </span>
                        <span className="font-medium text-slate-800">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1.5">
                        <span className="medium-14 text-slate-500">Size:</span>
                        <span className="font-medium text-slate-800 uppercase">
                          {item.size}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Orders Summary */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-t border-gray-200/60 pt-4 mt-3">
              <div className="flex flex-col gap-2.5 w-full lg:w-auto">
                <div className="flex items-center gap-x-2">
                  <h5 className="medium-14 font-semibold text-slate-700">
                    Order ID:
                  </h5>
                  <p className="text-gray-400 text-sm break-all font-mono">
                    {order._id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div className="flex items-center gap-x-2">
                    <h5 className="medium-14 font-medium text-slate-600">
                      Customer:
                    </h5>
                    <span
                      className={`px-2 py-0.5 rounded text-sm font-medium ${order.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                    >
                      {order.address.firstName} {order.address.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <h5 className="medium-14 font-medium text-slate-600">
                      Phone:
                    </h5>
                    <span
                      className={`px-2 py-0.5 rounded text-sm font-medium ${order.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                    >
                      {order.address.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <h5 className="medium-14 font-medium text-slate-600">
                      Address:
                    </h5>
                    <span
                      className={`px-2 py-0.5 rounded text-sm font-medium ${order.isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                    >
                      {order.address.street}, {order.address.city},{""}{" "}
                      {order.address.state}, {order.address.country},{""}{" "}
                      {order.address.zipCode}
                    </span>
                  </div>
                </div>
                <div clsassName="flex gap-4">
                  <div className="flex items-center gap-x-2">
                    <h5 className="medium-14 font-medium text-slate-600">
                      Payment Status:
                    </h5>
                    <p className="text-slate-800 text-sm font-bold">
                      {order.isPaid ? "Done" : "Pending"}
                    </p>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14 font-medium text-slate-600">
                        Method:
                      </h5>
                      <p className="text-slate-800 text-sm font-bold">
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-2">
                    <h5 className="medium-14 font-medium text-slate-600">
                      Date:
                    </h5>
                    <p className="text-slate-800 text-sm font-bold">
                      {new Date(order.createdAt).toDateString()}
                    </p>
                    <div className="flex items-center gap-x-2">
                      <h5 className="medium-14 font-medium text-slate-600">
                        Amount:
                      </h5>
                      <p className="text-slate-800 text-sm font-bold">
                        {order.amount}.000{currency}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                <h5 className="medium-14 font-medium text-slate-600">
                  Status:
                </h5>
                <select
                  onChange={(e) => statusHandler(e, order._id)}
                  value={order.status}
                  className="text-sm font-semibold p-1 ring-1 ring-slate-900/5 rounded max-w-36 bg-primary"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Packing">Packing</option>
                  <option value="Shipping">Shipping</option>
                  <option value="Delivery">Delivered</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
