import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import {
  getCartItemKey,
  removePurchasedItems,
} from "../../utils/cartSelection";

const COUNTRIES_NOW_API = "https://countriesnow.space/api/v0.1";
const VIETNAM_PROVINCES_API = "https://provinces.open-api.vn/api/v2/?depth=2";

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

const contactFields = [
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
];

const inputClass =
  "w-full rounded-md border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary";

const normalizeLocationName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/thanh pho|tinh|province|city/g, "")
    .replace(/[^a-z0-9]/g, "");

const getUniqueLocationNames = (values, locale) => {
  const locationsByKey = new Map();

  for (const value of values || []) {
    const name = String(value || "").trim();
    const key = normalizeLocationName(name);

    if (name && key && !locationsByKey.has(key)) {
      locationsByKey.set(key, name);
    }
  }

  return [...locationsByKey.values()].sort((a, b) =>
    a.localeCompare(b, locale),
  );
};

const CheckoutAddressForm = ({
  onOrderCreated,
  isSubmitting,
  setIsSubmitting,
  selectedItemKeys,
}) => {
  const {
    user,
    products,
    cartItems,
    method,
    axios,
    getToken,
    setCartItems,
    fetchProducts,
  } = useAppContext();

  const [address, setAddress] = useState(initialAddress);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [vietnamProvinces, setVietnamProvinces] = useState([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [countriesApiFailed, setCountriesApiFailed] = useState(false);
  const [citiesApiFailed, setCitiesApiFailed] = useState(false);

  const items = useMemo(() => {
    const result = [];

    for (const productId in cartItems) {
      const product = products.find((item) => item._id === productId);

      if (!product) continue;

      for (const size in cartItems[productId]) {
        const quantity = Number(cartItems[productId][size]);

        const itemKey = getCartItemKey(productId, size);

        if (quantity > 0 && selectedItemKeys.has(itemKey)) {
          result.push({
            product: productId,
            size,
            quantity,
          });
        }
      }
    }

    return result;
  }, [products, cartItems, selectedItemKeys]);

  useEffect(() => {
    if (!user) return;

    // Clerk may finish loading after this form mounts, so sync empty fields once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddress((current) => ({
      ...current,
      firstName: current.firstName || user.firstName || "",
      lastName: current.lastName || user.lastName || "",
      email: current.email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true);

        const { data } = await axios.get(`${COUNTRIES_NOW_API}/countries/iso`, {
          signal: controller.signal,
        });
        const countryNames = Array.isArray(data?.data)
          ? getUniqueLocationNames(
              data.data.map((country) => country.name),
              "en",
            )
          : [];

        setCountries(countryNames);
        setCountriesApiFailed(countryNames.length === 0);
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          setCountriesApiFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCountries(false);
        }
      }
    };

    loadCountries();

    return () => controller.abort();
  }, [axios]);

  useEffect(() => {
    if (!address.country) return undefined;

    const controller = new AbortController();

    const loadCities = async () => {
      try {
        setIsLoadingCities(true);

        let cityNames = [];

        if (address.country === "Vietnam") {
          const { data } = await axios.get(VIETNAM_PROVINCES_API, {
            signal: controller.signal,
          });
          const provinces = Array.isArray(data) ? data : [];

          setVietnamProvinces(provinces);
          cityNames = getUniqueLocationNames(
            provinces.map((province) => province.name),
            "vi",
          );
        } else {
          const { data } = await axios.post(
            `${COUNTRIES_NOW_API}/countries/cities`,
            { country: address.country },
            { signal: controller.signal },
          );

          cityNames = Array.isArray(data?.data)
            ? getUniqueLocationNames(data.data, "en")
            : [];
        }

        setCities(cityNames);
        setCitiesApiFailed(cityNames.length === 0);
      } catch (error) {
        if (error.code !== "ERR_CANCELED") {
          setCitiesApiFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCities(false);
        }
      }
    };

    loadCities();

    return () => controller.abort();
  }, [address.country, axios]);

  const wards = useMemo(() => {
    if (address.country !== "Vietnam" || !address.city) return [];

    const selectedProvince = vietnamProvinces.find(
      (province) => province.name === address.city,
    );

    return getUniqueLocationNames(
      (selectedProvince?.wards || []).map((ward) => ward.name),
      "vi",
    );
  }, [address.city, address.country, vietnamProvinces]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCountryChange = (event) => {
    const country = event.target.value;

    setAddress((current) => ({
      ...current,
      country,
      city: "",
      state: "",
    }));
    setCities([]);
    setVietnamProvinces([]);
    setCitiesApiFailed(false);
  };

  const handleCityChange = (event) => {
    const city = event.target.value;

    setAddress((current) => ({
      ...current,
      city,
      state: "",
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
        setCartItems((currentCart) =>
          removePurchasedItems(currentCart, items),
        );
      }

      await fetchProducts();

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
        {contactFields.map((field) => (
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

        <label>
          <span className="mb-2 block text-sm font-medium">Country *</span>

          {countriesApiFailed ? (
            <input
              required
              type="text"
              name="country"
              value={address.country}
              onChange={handleCountryChange}
              autoComplete="country-name"
              className={inputClass}
            />
          ) : (
            <select
              required
              name="country"
              value={address.country}
              onChange={handleCountryChange}
              disabled={isLoadingCountries}
              autoComplete="country-name"
              className={`${inputClass} disabled:cursor-wait`}
            >
              <option value="">
                {isLoadingCountries ? "Loading countries..." : "Select country"}
              </option>
              {address.country && !countries.includes(address.country) && (
                <option value={address.country}>{address.country}</option>
              )}
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          )}
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">
            {address.country === "Vietnam" ? "City" : "City"} {"*"}
          </span>

          {citiesApiFailed ? (
            <input
              required
              type="text"
              name="city"
              value={address.city}
              onChange={handleCityChange}
              autoComplete="address-level1"
              className={inputClass}
            />
          ) : (
            <select
              required
              name="city"
              value={address.city}
              onChange={handleCityChange}
              disabled={
                !address.country || isLoadingCities || cities.length === 0
              }
              autoComplete="address-level1"
              className={`${inputClass} disabled:cursor-not-allowed`}
            >
              <option value="">
                {isLoadingCities
                  ? "Loading cities..."
                  : address.country === "Vietnam"
                    ? "Select city"
                    : "Select city"}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">
            {address.country === "Vietnam"
              ? "Ward/ Commune"
              : "State/ Province"}{" "}
            {"*"}
          </span>

          {address.country === "Vietnam" && !citiesApiFailed ? (
            <select
              required
              name="state"
              value={address.state}
              onChange={handleChange}
              disabled={!address.city || isLoadingCities || wards.length === 0}
              autoComplete="address-level2"
              className={`${inputClass} disabled:cursor-not-allowed`}
            >
              <option value="">Select ward/ commune</option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          ) : (
            <input
              required
              type="text"
              name="state"
              value={address.state}
              onChange={handleChange}
              autoComplete="address-level2"
              className={inputClass}
            />
          )}
        </label>

        <label>
          <span className="mb-2 block text-sm font-medium">ZIP code *</span>
          <input
            required
            type="text"
            name="zipcode"
            value={address.zipcode}
            onChange={handleChange}
            autoComplete="postal-code"
            className={inputClass}
          />
        </label>
      </div>
    </form>
  );
};

export default CheckoutAddressForm;
