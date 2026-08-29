import React, { useState } from "react";
import { assets } from "../../assets/data";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const AddProduct = () => {
  const { axios, getToken } = useAppContext();
  const [images, setImages] = useState({
    1: null,
    2: null,
    3: null,
    4: null,
  });

  const [inputs, setInputs] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    popular: false,
  });

  const [sizePrices, setSizePrices] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const allCategories = ["Hair Care", "Body Care", "Face Care"];
  const allTypes = [
    "Body-Spray",
    "Cleanser",
    "Hand-Wash",
    "Lip-Product",
    "Lotion",
    "Oil",
    "Perfume",
    "Serum",
    "Shampoo",
  ];

  const addSizePrice = () => {
    if (!newSize || !newPrice) {
      toast.error("Please enter size and price");
      return;
    }
    if (sizePrices.some((sp) => sp.size === newSize)) {
      toast.error("Size already exists");
      return;
    }
    setSizePrices([
      ...sizePrices,
      { size: newSize, price: parseFloat(newPrice) },
    ]);
    setNewSize("");
    setNewPrice("");
  };

  const removeSizePrice = (size) => {
    setSizePrices(sizePrices.filter((sp) => sp.size !== size));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    // Check if all inputs are filled
    if (
      !inputs.title ||
      !inputs.description ||
      !inputs.category ||
      !inputs.type
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (sizePrices.length === 0) {
      toast.error("Please add at least one size and price");
      return;
    }

    const hasImage = Object.values(images).some((img) => img !== null);
    if (!hasImage) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      const prices = {};
      const sizes = [];
      sizePrices.forEach((sp) => {
        prices[sp.size] = sp.price;
        sizes.push(sp.size);
      });

      const productData = {
        title: inputs.title,
        description: inputs.description,
        category: inputs.category,
        type: inputs.type,
        popular: inputs.popular,
        price: prices,
        sizes: sizes,
      };

      formData.append("productData", JSON.stringify(productData));

      // Adding images to FormData
      Object.keys(images).forEach((key) => {
        if (images[key]) {
          formData.append("images", images[key]);
        }
      });

      const { data } = await axios.post("/api/products", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message);
        // Reset form after success
        setInputs({
          title: "",
          description: "",
          category: "",
          type: "",
          popular: false,
        });
        setSizePrices([]);
        setImages({
          1: null,
          2: null,
          3: null,
          4: null,
        });
      } else {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="md:px-8 py-6 xl:py-8 m-1 sm:m-3 h-[97vh] overflow-y-scroll lg:w-11/12 bg-primary shadow rounded-xl">
      <form
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-y-3.5 px-2 text-sm w-full lg:w-11/12"
      >
        <div className="w-full">
          <h5 className="h5">Product Name</h5>
          <input
            onChange={(e) => setInputs({ ...inputs, title: e.target.value })}
            value={inputs.title}
            type="text"
            placeholder="Type here..."
            className="px-3 py-1.5 ring-1 ring-slate-900/10 rounded-lg bg-white text-gray-600 medium-14 mt-1 w-full"
          />
        </div>
        <div className="w-full">
          <h5 className="h5">Product Description</h5>
          <textarea
            onChange={(e) =>
              setInputs({ ...inputs, description: e.target.value })
            }
            value={inputs.description}
            type="text"
            placeholder="Type here..."
            className="px-3 py-1.5 ring-1 ring-slate-900/10 rounded-lg bg-white text-gray-600 medium-14 mt-1 w-full"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div>
            <h5 className="h5">Category</h5>
            <select
              onChange={(e) =>
                setInputs({ ...inputs, category: e.target.value })
              }
              value={inputs.category}
              className="px-3 py-1.5 ring-1 ring-slate-900/10 rounded-lg
              bg-white text-gray-600 medium-14 mt-1 w-38"
            >
              <option value="">Select Category</option>
              {allCategories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h5 className="h5">Types</h5>
            <select
              onChange={(e) => setInputs({ ...inputs, type: e.target.value })}
              value={inputs.type}
              className="px-3 py-1.5 ring-1 ring-slate-900/10 rounded-lg
              bg-white text-gray-600 medium-14 mt-1 w-36"
            >
              <option value="">Select Type</option>
              {allTypes.map((t, index) => (
                <option key={index} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Size and Price Pairs */}
        <div className="w-full mt-4">
          <h5 className="h5">Sizes and Prices</h5>
          <div className="flex gap-4 mt-2">
            <input
              onChange={(e) => setNewSize(e.target.value)}
              value={newSize}
              type="text"
              placeholder="Size (vd. 50ml)"
              className="px-3 py-1.5 ring-1 ring-slate-900/10 rounded-lg bg-white text-gray-600 medium-14 w-32"
            />
            <input
              onChange={(e) => setNewPrice(e.target.value)}
              value={newPrice}
              type="number"
              placeholder="Price"
              className="px-3 py-1.5 ring-1 ring-slate-900/10 rounded-lg bg-white text-gray-600 medium-14 w-32"
            />
            <button
              type="button"
              onClick={addSizePrice}
              className="btn-secondary font-semibold p-1.5 rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="mt-2">
            {sizePrices.map((sp, index) => (
              <div key={index}>
                <span>
                  {sp.size}: ${sp.price}
                </span>
                <button
                  type="button"
                  onClick={() => removeSizePrice(sp.size)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="flex gap-2 mt-2">
          {Object.keys(images).map((key) => (
            <label
              key={key}
              htmlFor={`productImage${key}`}
              className="ring-1 ring-slate-900/10 overflow-hidden rounded-lg"
            >
              <input
                id={`productImage${key}`}
                onChange={(e) =>
                  setImages({ ...images, [key]: e.target.files[0] })
                }
                type="file"
                accept="image/*"
                hidden
              />
              <div className="h-16 w-22 bg-white flexCenter">
                <img
                  src={
                    images[key]
                      ? URL.createObjectURL(images[key])
                      : assets.uploadIcon
                  }
                  alt=""
                  className="w-17 overflow-hidden object-contain"
                />
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <h5 className="h5">Add to Popular</h5>
          <input
            type="checkbox"
            checked={inputs.popular}
            onChange={(e) =>
              setInputs({ ...inputs, popular: e.target.checked })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-secondary font-semibold mt-3 p-2 max-w-36 sm:w-full rounded-xl"
        >
          {loading ? "Adding" : "Add Product"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
