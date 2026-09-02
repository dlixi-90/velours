import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const initialAddress = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zipcode: "",
  country: "Vietnam",
};

const addressFields = [
  {
    name: "firstName",
    label: "First name",
  },
  {
    name: "lastName",
    label: "Last name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
  },
  {
    name: "street",
    label: "Street address",
    fullWidth: true,
  },
  {
    name: "city",
    label: "City",
  },
  {
    name: "state",
    label: "State / Province",
  },
  {
    name: "zipcode",
    label: "ZIP code",
  },
  {
    name: "country",
    label: "Country",
  },
];

const inputClass =
  "w-full rounded-md border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary";

const CheckoutAddressForm = ({
  onOrderCreated,
  isSubmitting,
  setIsSubmitting,
}) => {
  const { user, products, cartItems, method, axios, getToken, setCartItems } =
    useAppContext();

  const [address, setAddress] = useState(initialAddress);

  const items = useMemo(() => {
    const result = [];

    for (const productId in cartItems) {
      const product = products.find((item) => item._id === productId);

      if (!product) continue;

      for (const size in cartItems[productId]) {
        const quantity = Number(cartItems[productId][size]);

        if (quantity > 0) {
          result.push({
            product: productId,
            size,
            quantity,
          });
        }
      }
    }

    return result;
  }, [products, cartItems]);

  useEffect(() => {
    if (!user) return;

    setAddress((current) => ({
      ...current,
      firstName: current.firstName || user.firstName || "",
      lastName: current.lastName || user.lastName || "",
      email: current.email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const createAddress = async () => {
    const { data } = await axios.post(
      "/api/addresses/add",
      { address },
      {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      },
    );

    if (!data.success) {
      throw new Error(data.message);
    }

    if (!data.address?._id) {
      throw new Error("Server did not return created address");
    }

    return data.address._id;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!user) {
      return toast.error("Please login before placing an order");
    }

    if (items.length === 0) {
      return toast.error("Your cart is empty");
    }

    try {
      setIsSubmitting(true);

      // Tạo address trước
      const addressId = await createAddress();

      // Sau đó tạo order
      const endpoint = method === "QR" ? "/api/orders/qr" : "/api/orders/cod";

      const { data } = await axios.post(
        endpoint,
        {
          items,
          address: addressId,
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (!data.success) {
        return toast.error(data.message);
      }

      if (method === "COD") {
        setCartItems({});
      }

      toast.success(data.message);

      onOrderCreated(
        data.order || {
          paymentMethod: method,
          isPaid: false,
        },
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Could not place order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="checkout-address-form"
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 md:p-8"
    >
      <p className="text-sm uppercase tracking-wider text-gray-400">Checkout</p>

      <h2 className="mt-1 text-2xl font-semibold">Delivery Information</h2>

      <p className="mt-2 text-sm text-gray-500">
        Enter the address where you want your order delivered.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {addressFields.map((field) => (
          <label
            key={field.name}
            className={field.fullWidth ? "sm:col-span-2" : ""}
          >
            <span className="mb-2 block text-sm font-medium">
              {field.label} *
            </span>

            <input
              required
              type={field.type || "text"}
              name={field.name}
              value={address[field.name]}
              onChange={handleChange}
              autoComplete={field.name}
              className={inputClass}
            />
          </label>
        ))}
      </div>
    </form>
  );
};

export default CheckoutAddressForm;
