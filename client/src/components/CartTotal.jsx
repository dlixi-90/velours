import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { dummyAddress } from "../assets/data";

const CartTotal = () => {
  const {
    navigate,
    currency,
    method,
    setMethod,
    delivery_charges,
    getCartCount,
    getCartAmount,
  } = useAppContext();

  const [addresses, setAddresses] = useState(dummyAddress);
  const [showAddess, setShowaddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(dummyAddress[0]);

  return (
    <div>
      <h3 className="bold-22">
        Order Details
        <span className="bold-14 text-secondary">
          {" "}
          ({getCartCount()}) Items
        </span>
      </h3>
      <hr className="border-gray-300 my-5" />
      {/* Payment & Addresses */}
      <div className="mb-5">
        <div className="my-5">
          <h4 className="h4 mb-5">Where to ship your order?</h4>
          <div className="relative flex justify-between items-start mt-2">
            <p>
              {selectedAddress
                ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                : "No address found"}
            </p>
            <button
              onClick={() => setShowaddress(!showAddess)}
              className="text-secondary medium-14 hover:underline cursor-pointer"
            >
              Change
            </button>
            {showAddess && (
              <div className="absolute top-10 py-1 bg-white ring-1 ring-slate-900/10 text-sm w-full">
                {addresses.map((address, index) => (
                  <p
                    key={index}
                    onClick={() => {
                      setSelectedAddress(address);
                      setShowaddress(false);
                    }}
                    className="p-2 cursor-pointer hover:bg-gray-100 medium-14"
                  >
                    {address.street}, {address.city}, {address.state},
                    {address.country}
                  </p>
                ))}
                <p
                  onClick={() => {
                    navigate("/address-form");
                    scrollTo(0, 0);
                  }}
                  className="p-2 text-center cursor-pointer hover:bg-tertiary hover:text-white"
                >
                  Add Address
                </p>
              </div>
            )}
          </div>
        </div>
        <hr className="border-gray-300 mt-5" />
        <div className="my-6">
          <h4 className="h4 mb-5">Payment Method</h4>
          <div className="flex gap-3">
            <div
              onClick={() => setMethod("COD")}
              className={`${method === "COD" ? "btn-secondary" : "btn-outline"} !py-1 text-xs cursor-pointer`}
            >
              Cash On Delivery
            </div>
            <div
              onClick={() => setMethod("QR")}
              className={`${method === "QR" ? "btn-secondary" : "btn-outline"} !py-1 text-xs cursor-pointer`}
            >
              QR Code
            </div>
          </div>
        </div>
        <hr className="border-gray-300 mt-5" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <h5 className="h5">Price</h5>
          <p className="font-bold">
            {getCartAmount()}.000
            {currency}
          </p>
        </div>
        <div className="flex justify-between">
          <h5 className="h5">Shipping Fee</h5>
          <p className="font-bold">
            {getCartAmount() === 0 ? 0 : `${delivery_charges}`}.000
            {currency}
          </p>
        </div>
        <div className="flex justify-between text-lg font-medium mt-3">
          <h4 className="h4">Total Amount:</h4>
          <p className="bold-18">
            {getCartAmount() === 0 ? 0 : getCartAmount() + delivery_charges}.000
            {currency}
          </p>
        </div>
      </div>
      <button className="btn-dark w-full mt-8 !rounded-md">
        Proceed to Order
      </button>
    </div>
  );
};

export default CartTotal;
