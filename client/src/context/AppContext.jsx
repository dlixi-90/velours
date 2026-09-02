import { useAuth, useUser } from "@clerk/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState({});
  const [method, setMethod] = useState("COD");
  const [isOwner, setIsOwner] = useState(null);
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;
  const delivery_charges = 30;

  // Clerk
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Get the user Profile
  const getUser = async () => {
    try {
      const { data } = await axios.get("/api/users", {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });

      if (data.success) {
        setIsOwner(data.role === "owner");
        setCartItems(data.cartData || {});
      } else {
        setIsOwner(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsOwner(false);
      toast.error(error.message);
    }
  };

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/products");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Add Product to the cart
  const addToCart = async (itemId, size) => {
    if (!size) return toast.error("Please select a size first");
    let cartData = structuredClone(cartItems);
    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    setCartItems(cartData);

    if (user) {
      try {
        const { data } = await axios.post(
          "/api/cart/add",
          { itemId, size },
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          },
        );

        if (data.success) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Get Cart Count
  const getCartCount = () => {
    let count = 0;
    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        count += cartItems[itemId][size];
      }
    }
    return count;
  };

  // Update Cart Quantity
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (user) {
      try {
        const { data } = await axios.post(
          "/api/cart/update",
          { itemId, size, quantity },
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          },
        );

        if (data.success) {
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Get Cart Amount
  const getCartAmount = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const product = products.find((p) => p._id === itemId);
      if (!product) continue;
      for (const size in cartItems[itemId]) {
        total += product.price[size] * cartItems[itemId][size];
      }
    }
    return total;
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setIsOwner(false);
      return;
    }

    getUser();
  }, [isLoaded, user]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const value = {
    navigate,
    user,
    products,
    fetchProducts,
    currency,
    searchQuery,
    setSearchQuery,
    cartItems,
    setCartItems,
    method,
    setMethod,
    delivery_charges,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    isOwner,
    setIsOwner,
    axios,
    getToken,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
