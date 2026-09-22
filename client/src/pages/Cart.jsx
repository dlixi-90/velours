import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import CartSteps from "../components/CartSteps";
import QrPaymentStatus from "../components/QrPaymentStatus";
import CheckoutAddressForm from "../components/checkout/CheckoutAddressForm";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/data";
import { formatThousandsVnd } from "../utils/money";
import { getCartItemKey, changeSizeSelection } from "../utils/cartSelection";
import { getSizeQuantity, isSizeAvailable } from "../utils/productStock";
import { initialCheckoutAddress } from "../utils/checkoutAddress";

const CartCheckbox = ({
  checked,
  onChange,
  label,
  indeterminate = false,
  inputRef,
  disabled = false,
}) => (
  <label
    className="group flex cursor-pointer items-center justify-center rounded-md p-2"
    title={label}
  >
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={label}
      className="peer sr-only"
    />
    <span
      aria-hidden="true"
      className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border-2 transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-secondary/40 peer-focus-visible:ring-offset-2 ${
        checked || indeterminate
          ? "border-secondary bg-secondary text-white shadow-sm"
          : "border-[#c8ccc9] bg-white group-hover:border-secondary"
      }`}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2.5 rounded-full bg-white" />
      ) : checked ? (
        <Check size={15} strokeWidth={3} />
      ) : null}
    </span>
  </label>
);

const Cart = () => {
  const {
    navigate,
    user,
    products,
    currency,
    cartItems,
    updateQuantity,
    changeCartSize,
    axios,
    getToken,
  } = useAppContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const cartUpdateRef = useRef(false);
  const [checkoutAddress, setCheckoutAddress] = useState(
    initialCheckoutAddress,
  );
  const [deselectedItemKeys, setDeselectedItemKeys] = useState(
    () => new Set(),
  );
  const selectAllRef = useRef(null);

  const cartData = useMemo(() => {
    if (products.length === 0) return [];

    const result = [];

    for (const productId in cartItems) {
      for (const size in cartItems[productId] || {}) {
        if (Number(cartItems[productId]?.[size]) > 0) {
          result.push({
            _id: productId,
            size,
          });
        }
      }
    }

    return result;
  }, [products, cartItems]);

  const selectedItemKeys = useMemo(
    () =>
      new Set(
        cartData
          .map((item) => getCartItemKey(item._id, item.size))
          .filter((itemKey) => !deselectedItemKeys.has(itemKey)),
      ),
    [cartData, deselectedItemKeys],
  );
  const allItemsSelected =
    cartData.length > 0 && selectedItemKeys.size === cartData.length;
  const someItemsSelected =
    selectedItemKeys.size > 0 && selectedItemKeys.size < cartData.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someItemsSelected;
    }
  }, [someItemsSelected]);

  const toggleItemSelection = (itemKey) => {
    setDeselectedItemKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(itemKey)) {
        nextKeys.delete(itemKey);
      } else {
        nextKeys.add(itemKey);
      }

      return nextKeys;
    });
  };

  const toggleAllItems = () => {
    setDeselectedItemKeys(
      allItemsSelected
        ? new Set(
            cartData.map((item) => getCartItemKey(item._id, item.size)),
          )
        : new Set(),
    );
  };

  useEffect(() => {
    if (!user) return undefined;

    let isActive = true;

    const restorePendingPayment = async () => {
      try {
        const { data } = await axios.get("/api/orders/pending-payment", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });

        if (isActive && data.success && data.order) {
          setCreatedOrder(data.order);
          setCurrentStep(3);
          setHighestStep(3);
        }
      } catch {
        // The cart remains usable if no pending payment can be restored.
      }
    };

    restorePendingPayment();

    return () => {
      isActive = false;
    };
  }, [axios, getToken, user]);

  const runCartUpdate = async (update) => {
    if (cartUpdateRef.current) return;
    cartUpdateRef.current = true;
    setIsUpdatingCart(true);
    try {
      await update();
    } finally {
      cartUpdateRef.current = false;
      setIsUpdatingCart(false);
    }
  };

  const handleSizeChange = (productId, fromSize, toSize) => runCartUpdate(async () => {
    const targetExists = Number(cartItems[productId]?.[toSize] ?? 0) > 0;
    const result = await changeCartSize(productId, fromSize, toSize);
    if (!result.success) return;
    setDeselectedItemKeys((current) =>
      changeSizeSelection(current, productId, fromSize, toSize, targetExists),
    );
    toast.success(targetExists ? "Size updated and quantities merged. Please check your selection." : "Size updated");
  });

  const increment = (productId, size) => {
    const quantity = cartItems[productId]?.[size] || 0;

    runCartUpdate(() => updateQuantity(productId, size, quantity + 1));
  };

  const decrement = (productId, size) => {
    const quantity = cartItems[productId]?.[size] || 0;

    if (quantity > 1) {
      runCartUpdate(() => updateQuantity(productId, size, quantity - 1));
    }
  };

  const handleCheckout = () => {
    if (cartUpdateRef.current) return;
    if (selectedItemKeys.size === 0) {
      return toast.error("Please select at least one product");
    }

    if (!user) {
      return toast.error("Please login before checkout");
    }

    setCurrentStep(2);
    setHighestStep(2);
    window.scrollTo(0, 0);
  };

  const handleOrderCreated = (order) => {
    setCreatedOrder(order);
    setCurrentStep(3);
    setHighestStep(3);
    window.scrollTo(0, 0);
  };

  const handleQrExpired = () => {
    setCreatedOrder(null);
    setCurrentStep(1);
    setHighestStep(1);
    window.scrollTo(0, 0);
  };

  const handleQrCancelled = useCallback(() => {
    setCreatedOrder(null);
    setCurrentStep(2);
    setHighestStep(2);
    window.scrollTo(0, 0);
  }, []);

  const handleStepChange = (step) => {
    if (cartUpdateRef.current) return;
    if (createdOrder) return;
    if (step > highestStep) return;

    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  return products && cartItems ? (
    <div className="max-padd-container bg-primary py-16 pt-28">
      <CartSteps
        currentStep={currentStep}
        highestStep={highestStep}
        onStepChange={handleStepChange}
        locked={Boolean(createdOrder) || isUpdatingCart}
      />

      {/* STEP 1 */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-10 xl:flex-row xl:items-start xl:gap-12">
          {/* Cart items bên trái */}
          <section className="flex min-w-0 flex-[2] flex-col gap-3 text-[95%]">
            <Title title1="Cart" title2="Overview" title1Styles="pb-5" />

            {cartData.length > 0 ? (
              <>
                <div className="grid grid-cols-[60px_minmax(0,6fr)_2fr_1fr] items-center rounded-xl bg-white p-3 font-medium sm:grid-cols-[72px_minmax(0,6fr)_2fr_1fr]">
                  <div className="flex justify-center">
                    <CartCheckbox
                      inputRef={selectAllRef}
                      disabled={isUpdatingCart}
                      checked={allItemsSelected}
                      onChange={toggleAllItems}
                      indeterminate={someItemsSelected}
                      label="Select all products"
                    />
                  </div>

                  <h5 className="h5 text-left">Product Details</h5>

                  <h5 className="h5 text-center">Subtotal</h5>

                  <h5 className="h5 text-center">Action</h5>
                </div>

                {cartData.map((item) => {
                  const product = products.find(
                    (productItem) => productItem._id === item._id,
                  );

                  if (!product) return null;

                  const quantity = Number(
                    cartItems[item._id]?.[item.size] ?? 0,
                  );
                  const itemKey = getCartItemKey(item._id, item.size);
                  const isSelected = selectedItemKeys.has(itemKey);

                  if (quantity <= 0) return null;

                  return (
                    <div
                      key={`${item._id}-${item.size}`}
                      className={`grid grid-cols-[60px_minmax(0,6fr)_2fr_1fr] items-center rounded-xl p-3 transition sm:grid-cols-[72px_minmax(0,6fr)_2fr_1fr] ${
                        isSelected ? "bg-white" : "bg-white/60"
                      }`}
                    >
                      <div className="flex justify-center">
                        <CartCheckbox
                          disabled={isUpdatingCart}
                          checked={isSelected}
                          onChange={() => toggleItemSelection(itemKey)}
                          label={`Select ${product.title}, size ${item.size}`}
                        />
                      </div>

                      <div className="flex min-w-0 items-center gap-3 md:gap-6">
                        <div className="flex rounded-xl bg-primary">
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <h5 className="h5 line-clamp-1">{product.title}</h5>

                          <label className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                            <span>Size:</span>
                            <select
                              aria-label={`Size for ${product.title}, currently ${item.size}`}
                              value={item.size}
                              disabled={isUpdatingCart}
                              onChange={(event) => handleSizeChange(item._id, item.size, event.target.value)}
                              className="min-w-0 max-w-full rounded-md border border-gray-300 bg-white px-2 py-1 disabled:opacity-50"
                            >
                              {!product.sizes.includes(item.size) && (
                                <option value={item.size}>{item.size} (unavailable)</option>
                              )}
                              {product.sizes.map((size) => {
                                const required = quantity + (size === item.size ? 0 : Number(cartItems[item._id]?.[size] ?? 0));
                                const available = isSizeAvailable(product, size);
                                const enoughStock = required <= getSizeQuantity(product, size);
                                return (
                                  <option key={size} value={size} disabled={size !== item.size && (!available || !enoughStock)}>
                                    {size}
                                    {!available ? " (out of stock)" : !enoughStock ? " (insufficient stock)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </label>

                          <div className="inline-flex items-center overflow-hidden rounded-full bg-primary ring-1 ring-slate-900/15">
                            <button
                              type="button"
                              onClick={() => decrement(item._id, item.size)}
                              disabled={isUpdatingCart}
                              className="cursor-pointer rounded-full bg-secondary p-1.5 text-white shadow-md"
                            >
                              <img
                                src={assets.minus}
                                alt="Decrease"
                                width={11}
                                className="invert"
                              />
                            </button>

                            <p className="px-3">{quantity}</p>

                            <button
                              type="button"
                              onClick={() => increment(item._id, item.size)}
                              disabled={isUpdatingCart}
                              className="cursor-pointer rounded-full bg-secondary p-1.5 text-white shadow-md"
                            >
                              <img
                                src={assets.plus}
                                alt="Increase"
                                width={11}
                                className="invert"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-center bold-16">
                        {formatThousandsVnd(
                          product.price[item.size] * quantity,
                          currency,
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => runCartUpdate(() => updateQuantity(item._id, item.size, 0))}
                        disabled={isUpdatingCart}
                        className="mx-auto cursor-pointer"
                      >
                        <img
                          src={assets.cartRemove}
                          alt="Remove product"
                          width={22}
                        />
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="rounded-xl bg-white px-6 py-16 text-center">
                <h2 className="text-xl font-semibold">Your cart is empty</h2>

                <p className="mt-2 text-gray-500">
                  Add some products before checking out.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/collection")}
                  className="btn-dark mt-6 !rounded-md"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </section>

          {/* CartTotal luôn bên phải */}
          <aside className="w-full xl:w-[379px] xl:flex-none">
            <div className="w-full rounded-xl bg-white p-5 py-10 xl:sticky xl:top-28">
              <CartTotal
                currentStep={1}
                isSubmitting={isUpdatingCart}
                onCheckout={handleCheckout}
                selectedItemKeys={selectedItemKeys}
              />
            </div>
          </aside>
        </div>
      )}

      {/* STEP 2 */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_379px] xl:items-start">
          {/* Address Form bên trái */}
          <CheckoutAddressForm
            onOrderCreated={handleOrderCreated}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            selectedItemKeys={selectedItemKeys}
            address={checkoutAddress}
            setAddress={setCheckoutAddress}
          />

          {/* CartTotal vẫn bên phải */}
          <aside className="w-full xl:w-[379px]">
            <div className="w-full rounded-xl bg-white p-5 py-8 xl:sticky xl:top-28">
              <CartTotal
                currentStep={2}
                isSubmitting={isSubmitting}
                selectedItemKeys={selectedItemKeys}
                onBack={() => {
                  setCurrentStep(1);
                  window.scrollTo(0, 0);
                }}
              />
            </div>
          </aside>
        </div>
      )}

      {/* STEP 3 QR */}
      {currentStep === 3 && createdOrder?.paymentMethod === "QR" && (
        <QrPaymentStatus
          initialOrder={createdOrder}
          onExpired={handleQrExpired}
          onCancelled={handleQrCancelled}
        />
      )}

      {/* STEP 3 COD */}
      {currentStep === 3 && createdOrder?.paymentMethod === "COD" && (
        <div className="mx-auto max-w-xl rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
            {"\u2713"}
          </div>

          <h2 className="mt-5 text-2xl font-semibold">
            Order placed successfully
          </h2>

          <p className="mt-3 text-gray-500">
            Your order has been created. You will pay when it is delivered.
          </p>

          <button
            type="button"
            onClick={() => navigate("/my-orders")}
            className="btn-dark mt-8 !rounded-md"
          >
            View My Orders
          </button>
        </div>
      )}
    </div>
  ) : null;
};

export default Cart;
