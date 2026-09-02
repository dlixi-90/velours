import React from "react";
import Header from "./components/Header";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import Footer from "./components/Footer";
import ProductDetail from "./pages/ProductDetail";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";
import { Toaster } from "react-hot-toast";
import Sidebar from "./components/owner/Sidebar";
import Dashboard from "./pages/owner/Dashboard";
import AddProduct from "./pages/owner/AddProduct";
import ListProduct from "./pages/owner/ListProduct";

const App = () => {
  const location = useLocation();
  const isOwnerPath = location.pathname.includes("owner");
  return (
    <main className="overflow-hidden text-tertiary">
      {!isOwnerPath && <Header />}
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/collection/:productId" element={<ProductDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/owner" element={<Sidebar />}>
          <Route index element={<Dashboard />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="list-product" element={<ListProduct />} />
        </Route>
      </Routes>
      {!isOwnerPath && <Footer />}
    </main>
  );
};

export default App;
