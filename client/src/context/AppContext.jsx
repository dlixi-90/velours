import { useAuth, useUser } from "@clerk/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import {
  getSizeQuantity,
  isSizeAvailable,
} from "../utils/productStock";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();
const MAX_CART_ADD_QUANTITY = 10;

const setCartItemQuantity = (cartData, itemId, size, quantity) => {
  const nextCartData = structuredClone(cartData);

  if (quantity <= 0) {
    if (!nextCartData[itemId]) return nextCartData;

    delete nextCartData[itemId][size];

    if (Object.keys(nextCartData[itemId]).length === 0) {
      delete nextCartData[itemId];
    }

    return nextCartData;
  }

  nextCartData[itemId] = nextCartData[itemId] || {};
  nextCartData[itemId][size] = quantity;

  return nextCartData;
};

const getRequestErrorMessage = (error, fallbackMessage) => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

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
  const getUser = useCallback(async () => {
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
  }, [getToken]);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
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
  }, []);

  // Replace only the product returned by an update API.
  // This avoids fetching the complete catalog after every stock toggle.
  const replaceProduct = (updatedProduct) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product._id === updatedProduct._id ? updatedProduct : product,
      ),
    );
  };

  // Add Product to the cart
  const addToCart = async (
    itemId,
    size,
    quantity = 1,
    onOptimisticSuccess,
  ) => {
    const addedQuantity = Number(quantity);

    if (!size) {
      const message = "Please select a size first";
      toast.error(message);
      return { success: false, message };
    }

    if (
      !Number.isInteger(addedQuantity) ||
      addedQuantity < 1 ||
      addedQuantity > MAX_CART_ADD_QUANTITY
    ) {
      const message = `Quantity must be between 1 and ${MAX_CART_ADD_QUANTITY}`;
      toast.error(message);
      return { success: false, message };
    }

    const product = products.find((item) => item._id === itemId);

    if (!product || !product.sizes?.includes(size)) {
      const message = "Product or size not found";
      toast.error(message);
      return { success: false, message };
    }

    if (!isSizeAvailable(product, size)) {
      const message = "This product size is out of stock";
      toast.error(message);
      return { success: false, message };
    }

    const currentQuantity = Number(cartItems[itemId]?.[size] ?? 0);
    const nextQuantity = currentQuantity + addedQuantity;
    const stockQuantity = getSizeQuantity(product, size);

    if (nextQuantity > stockQuantity) {
      const message = `Only ${stockQuantity} items are available for size ${size}`;
      toast.error(message);
      return { success: false, message };
    }

    setCartItems((currentCart) =>
      setCartItemQuantity(currentCart, itemId, size, nextQuantity),
    );
    onOptimisticSuccess?.();

    if (!user) {
      return { success: true, quantity: nextQuantity };
    }

    try {
      const { data } = await axios.post(
        "/api/cart/add",
        { itemId, size, quantity: addedQuantity },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        },
      );

      if (!data.success) {
        throw new Error(data.message || "Unable to add item to cart");
      }

      setCartItems((currentCart) =>
        setCartItemQuantity(
          currentCart,
          itemId,
          size,
          Number(data.quantity ?? nextQuantity),
        ),
      );

      return {
        success: true,
        quantity: Number(data.quantity ?? nextQuantity),
      };
    } catch (error) {
      setCartItems((currentCart) => {
        if (currentCart[itemId]?.[size] !== nextQuantity) {
          return currentCart;
        }

        return setCartItemQuantity(
          currentCart,
          itemId,
          size,
          currentQuantity,
        );
      });

      const message = getRequestErrorMessage(
        error,
        "Unable to add item to cart",
      );
      toast.error(message);
      return { success: false, message };
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
    const nextQuantity = Number(quantity);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      const message = "Quantity must be a non-negative integer";
      toast.error(message);
      return { success: false, message };
    }

    const currentQuantity = Number(cartItems[itemId]?.[size] ?? 0);

    if (nextQuantity > 0) {
      const product = products.find((item) => item._id === itemId);

      if (!product || !product.sizes?.includes(size)) {
        const message = "Product or size not found";
        toast.error(message);
        return { success: false, message };
      }

      if (!isSizeAvailable(product, size)) {
        const message = "This product size is out of stock";
        toast.error(message);
        return { success: false, message };
      }

      const stockQuantity = getSizeQuantity(product, size);

      if (nextQuantity > stockQuantity) {
        const message = `Only ${stockQuantity} items are available for size ${size}`;
        toast.error(message);
        return { success: false, message };
      }
    }

    setCartItems((currentCart) =>
      setCartItemQuantity(currentCart, itemId, size, nextQuantity),
    );

    if (!user) {
      return { success: true, quantity: nextQuantity };
    }

    try {
      const { data } = await axios.post(
        "/api/cart/update",
        { itemId, size, quantity: nextQuantity },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        },
      );

      if (!data.success) {
        throw new Error(data.message || "Unable to update cart");
      }

      setCartItems((currentCart) =>
        setCartItemQuantity(
          currentCart,
          itemId,
          size,
          Number(data.quantity ?? nextQuantity),
        ),
      );
      return {
        success: true,
        quantity: Number(data.quantity ?? nextQuantity),
      };
    } catch (error) {
      setCartItems((currentCart) => {
        const savedQuantity = Number(currentCart[itemId]?.[size] ?? 0);

        if (savedQuantity !== nextQuantity) {
          return currentCart;
        }

        return setCartItemQuantity(
          currentCart,
          itemId,
          size,
          currentQuantity,
        );
      });

      const message = getRequestErrorMessage(error, "Unable to update cart");
      toast.error(message);
      return { success: false, message };
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
      queueMicrotask(() => {
        setIsOwner(false);
        setCartItems({});
      });
      return undefined;
    }

    const timeoutId = window.setTimeout(getUser, 0);

    return () => window.clearTimeout(timeoutId);
  }, [getUser, isLoaded, user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchProducts, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  const value = {
    navigate,
    user,
    products,
    fetchProducts,
    replaceProduct,
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

// This colocated hook keeps the existing public context API stable.
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
