import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, ImagePlus, PackagePlus, Plus, Trash2, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useParams } from "react-router-dom";

const ALL_CATEGORIES = ["Hair Care", "Body Care", "Face Care"];

const ALL_TYPES = [
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

const createEmptyImages = () => ({
  1: null,
  2: null,
  3: null,
  4: null,
});

const createEmptyInputs = () => ({
  title: "",
  description: "",
  ingredients: "",
  category: "",
  type: "",
  popular: false,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const AddProduct = () => {
  const { productId } = useParams();

  const { axios, getToken, products, fetchProducts, navigate } =
    useAppContext();

  const isEditMode = Boolean(productId);

  const [images, setImages] = useState(createEmptyImages);
  const [inputs, setInputs] = useState(createEmptyInputs);

  const [sizePrices, setSizePrices] = useState([]);
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  const [loading, setLoading] = useState(false);
  const [imageInputVersion, setImageInputVersion] = useState(0);

  const [loadedProductId, setLoadedProductId] = useState(null);

  useEffect(() => {
    if (!isEditMode || loadedProductId === productId) {
      return;
    }

    const product = products.find((item) => item._id === productId);

    if (!product) {
      return;
    }

    // Seed the editable form once after the product arrives from context.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInputs({
      title: product.title || "",
      description: product.description || "",
      ingredients: product.ingredients || "",
      category: product.category || "",
      type: product.type || "",
      popular: Boolean(product.popular),
    });

    setSizePrices(
      (product.sizes || []).map((size) => ({
        size,
        price: Number(product.price?.[size] ?? 0),
        quantity: Number(product.stockBySize?.[size] ?? 0),
      })),
    );

    const loadedImages = createEmptyImages();

    (product.images || []).slice(0, 4).forEach((imageUrl, index) => {
      loadedImages[index + 1] = imageUrl;
    });

    setImages(loadedImages);
    setLoadedProductId(productId);
  }, [isEditMode, loadedProductId, productId, products]);

  const updateInput = (field, value) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [field]: value,
    }));
  };

  const addSizePrice = () => {
    const size = newSize.trim();
    const price = Number(newPrice);
    const quantity = Number(newQuantity);

    if (!size || newPrice === "" || newQuantity === "") {
      toast.error("Please enter size, price and quantity");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error("Quantity must be a non-negative integer");
      return;
    }

    const sizeAlreadyExists = sizePrices.some(
      (item) => item.size.trim().toLowerCase() === size.toLowerCase(),
    );

    if (sizeAlreadyExists) {
      toast.error("Size already exists");
      return;
    }

    setSizePrices((currentSizePrices) => [
      ...currentSizePrices,
      {
        size,
        price,
        quantity,
      },
    ]);

    setNewSize("");
    setNewPrice("");
    setNewQuantity("");
  };

  const removeSizePrice = (size) => {
    setSizePrices((currentSizePrices) =>
      currentSizePrices.filter((item) => item.size !== size),
    );
  };

  const updateSizePrice = (size, field, value) => {
    setSizePrices((currentItems) =>
      currentItems.map((item) =>
        item.size === size
          ? {
              ...item,
              [field]: value === "" ? "" : Number(value),
            }
          : item,
      ),
    );
  };

  const handleSizePriceKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSizePrice();
    }
  };

  const handleImageChange = (slot, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Each image must be smaller than 5 MB");
      return;
    }

    setImages((currentImages) => ({
      ...currentImages,
      [slot]: file,
    }));
  };

  const removeImage = (slot) => {
    setImages((currentImages) => ({
      ...currentImages,
      [slot]: null,
    }));

    setImageInputVersion((version) => version + 1);
  };

  const resetForm = () => {
    setInputs(createEmptyInputs());
    setSizePrices([]);
    setNewSize("");
    setNewPrice("");
    setNewQuantity("");
    setImages(createEmptyImages());
    setImageInputVersion((version) => version + 1);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (
      !inputs.title.trim() ||
      !inputs.description.trim() ||
      !inputs.category ||
      !inputs.type
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (sizePrices.length === 0) {
      toast.error("Please add at least one size, price and quantity");
      return;
    }

    const hasInvalidVariant = sizePrices.some(
      ({ size, price, quantity }) =>
        !size.trim() ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0 ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) < 0,
    );

    if (hasInvalidVariant) {
      toast.error("Every size must have a valid price and quantity");
      return;
    }

    const selectedImages = Object.values(images).filter(Boolean);

    const existingImages = selectedImages.filter(
      (image) => typeof image === "string",
    );

    const newImages = selectedImages.filter((image) => image instanceof File);

    if (selectedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setLoading(true);

    try {
      const prices = {};
      const stockBySize = {};
      const sizes = [];

      sizePrices.forEach(({ size, price, quantity }) => {
        prices[size] = Number(price);
        stockBySize[size] = Number(quantity);
        sizes.push(size);
      });

      const productData = {
        title: inputs.title.trim(),
        description: inputs.description.trim(),
        ingredients: inputs.ingredients.trim(),
        category: inputs.category,
        type: inputs.type,
        popular: inputs.popular,
        price: prices,
        stockBySize,
        sizes,
        ...(isEditMode && {
          existingImages,
        }),
      };

      const formData = new FormData();

      formData.append("productData", JSON.stringify(productData));

      newImages.forEach((image) => {
        formData.append("images", image);
      });

      const token = await getToken();

      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = isEditMode
        ? await axios.put(`/api/products/${productId}`, formData, requestConfig)
        : await axios.post("/api/products", formData, requestConfig);

      if (data.success) {
        toast.success(
          data.message ||
            (isEditMode
              ? "Product updated successfully"
              : "Product added successfully"),
        );

        await fetchProducts();

        if (isEditMode) {
          navigate("/owner/list-product");
        } else {
          resetForm();
        }
      } else {
        toast.error(
          data.message ||
            (isEditMode ? "Unable to update product" : "Unable to add product"),
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          (isEditMode ? "Unable to update product" : "Unable to add product"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="m-1 h-[97vh] overflow-y-auto rounded-xl bg-primary px-3 py-6 shadow sm:m-3 sm:px-5 md:px-8 lg:w-11/12 xl:py-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-6 flex flex-col gap-4 border-b border-[#e1e6e3] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6f9a79]">
              Products
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[#263b4a] sm:text-3xl">
              {isEditMode ? "Edit Product" : "Add Product"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71808a]">
              {isEditMode
                ? "Update product details, images, prices and inventory by size."
                : "Create a new catalog item, set its available sizes and add product photos."}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8e5da] bg-[#edf6ee] px-3 py-1.5 text-xs font-medium text-[#557b5e]">
            <PackagePlus size={15} />
            {isEditMode ? "Editing catalog item" : "New catalog item"}
          </div>
        </header>

        <form
          onSubmit={onSubmitHandler}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <section className="rounded-2xl border border-[#e2e7e4] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#263b4a]">
                Product details
              </h2>

              <p className="mt-1 text-sm text-[#839099]">
                Enter the information customers will see in your store.
              </p>
            </div>

            <div className="space-y-5">
              <Field
                label="Product name"
                hint="Use a clear, searchable product name."
                required
              >
                <input
                  value={inputs.title}
                  onChange={(event) => updateInput("title", event.target.value)}
                  type="text"
                  placeholder="e.g. Nourishing Body Lotion"
                  className="admin-input"
                  autoComplete="off"
                  required
                />
              </Field>

              <Field
                label="Description"
                hint="Explain the benefits and important product details."
                required
              >
                <textarea
                  value={inputs.description}
                  onChange={(event) =>
                    updateInput("description", event.target.value)
                  }
                  placeholder="Describe your product..."
                  rows={6}
                  className="admin-input min-h-36 resize-y"
                  required
                />
              </Field>

              <Field
                label="Ingredients"
                hint="Add the full ingredient list as printed on the product packaging."
              >
                <textarea
                  value={inputs.ingredients}
                  onChange={(event) =>
                    updateInput("ingredients", event.target.value)
                  }
                  placeholder="e.g. Aqua, Glycerin, Aloe Barbadensis Leaf Juice..."
                  rows={4}
                  className="admin-input min-h-28 resize-y"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category" required>
                  <select
                    value={inputs.category}
                    onChange={(event) =>
                      updateInput("category", event.target.value)
                    }
                    className="admin-input"
                    required
                  >
                    <option value="">Select category</option>

                    {ALL_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Product type" required>
                  <select
                    value={inputs.type}
                    onChange={(event) =>
                      updateInput("type", event.target.value)
                    }
                    className="admin-input"
                    required
                  >
                    <option value="">Select type</option>

                    {ALL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="rounded-xl border border-[#e2e7e4] bg-[#f8faf8] p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#263b4a]">
                    Sizes, prices and inventory
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#839099]">
                    Add a price and available stock quantity for each product
                    size. Price is entered in thousands of VND.
                  </p>
                </div>

                {/* Add variant form */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input
                    value={newSize}
                    onChange={(event) => setNewSize(event.target.value)}
                    onKeyDown={handleSizePriceKeyDown}
                    type="text"
                    placeholder="Size, e.g. 50ml"
                    aria-label="Product size"
                    className="admin-input"
                  />

                  <input
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                    onKeyDown={handleSizePriceKeyDown}
                    type="number"
                    min="1"
                    step="0.1"
                    placeholder="Price"
                    aria-label="Price in thousands of VND"
                    className="admin-input"
                  />

                  <input
                    value={newQuantity}
                    onChange={(event) => setNewQuantity(event.target.value)}
                    onKeyDown={handleSizePriceKeyDown}
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    placeholder="Quantity"
                    aria-label="Stock quantity"
                    className="admin-input"
                  />

                  <button
                    type="button"
                    onClick={addSizePrice}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cfdad2] bg-white px-4 py-2.5 text-sm font-medium text-[#496852] transition hover:border-[#86a78d] hover:bg-[#f2f7f3]"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>

                {/* Added variants */}
                <div className="mt-4 space-y-2" aria-live="polite">
                  {sizePrices.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#d5ddd7] px-4 py-6 text-center">
                      <PackagePlus
                        size={20}
                        className="mx-auto text-[#8ca095]"
                      />

                      <p className="mt-2 text-sm font-medium text-[#76847c]">
                        No product variants added
                      </p>

                      <p className="mt-1 text-xs text-[#9aa49e]">
                        Enter a size, price and quantity above.
                      </p>
                    </div>
                  ) : (
                    sizePrices.map((item) => (
                      <div
                        key={item.size}
                        className="relative rounded-lg border border-[#e0e6e2] bg-white px-4 py-4"
                      >
                        <div className="min-w-0 pr-12">
                          <p className="text-sm font-semibold text-[#263b4a]">
                            {item.size}
                          </p>

                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label>
                              <span className="mb-1.5 block text-xs font-medium text-[#78868f]">
                                Price (thousand VND)
                              </span>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.price}
                                onChange={(event) =>
                                  updateSizePrice(
                                    item.size,
                                    "price",
                                    event.target.value,
                                  )
                                }
                                className="admin-input"
                                aria-label={`Price for size ${item.size}`}
                              />
                            </label>

                            <label>
                              <span className="mb-1.5 block text-xs font-medium text-[#78868f]">
                                Quantity
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateSizePrice(
                                    item.size,
                                    "quantity",
                                    event.target.value,
                                  )
                                }
                                className="admin-input"
                                aria-label={`Quantity for size ${item.size}`}
                              />
                            </label>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSizePrice(item.size)}
                          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#a85c5c] transition hover:bg-[#fff0f0]"
                          aria-label={`Remove size ${item.size}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-2xl border border-[#e2e7e4] bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#263b4a]">
                  Product images
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#839099]">
                  Upload up to 4 clear images. The first image is used as the
                  main product photo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.keys(images).map((slot) => (
                  <ImageUpload
                    key={slot + "-" + imageInputVersion}
                    slot={slot}
                    file={images[slot]}
                    onChange={handleImageChange}
                    onRemove={removeImage}
                  />
                ))}
              </div>

              <p className="mt-3 text-xs leading-5 text-[#909ba2]">
                JPG, PNG or WEBP. Maximum 5 MB per image.
              </p>
            </section>

            <section className="rounded-2xl border border-[#e2e7e4] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#263b4a]">
                Publishing
              </h2>

              <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e2e7e4] bg-[#f8faf8] p-4">
                <span>
                  <span className="block text-sm font-medium text-[#263b4a]">
                    Add to popular
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#839099]">
                    Feature this item in the popular products section.
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={inputs.popular}
                  onChange={(event) =>
                    updateInput("popular", event.target.checked)
                  }
                  className="h-4 w-4 shrink-0 accent-[#557b5e]"
                />
              </label>

              <div className="my-5 flex items-center gap-2 border-y border-[#edf0ee] py-4 text-xs text-[#71808a]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#edf6ee] text-[#557b5e]">
                  <Check size={14} />
                </span>
                {isEditMode
                  ? "Changes will be applied after saving the product."
                  : "Product will be available after it is added."}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="admin-primary-button w-full justify-center"
              >
                <PackagePlus size={17} />

                {loading
                  ? isEditMode
                    ? "Saving changes..."
                    : "Adding product..."
                  : isEditMode
                    ? "Save changes"
                    : "Add product"}
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => navigate("/owner/list-product")}
                  className="mt-3 w-full rounded-lg border border-[#dfe5e8] px-4 py-2.5 text-sm font-medium text-[#52616a] transition hover:bg-[#f7f9f8]"
                >
                  Cancel
                </button>
              )}
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
};

const Field = ({ label, hint, required = false, children }) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#334957]">
        {label}

        {required && <span className="ml-1 text-[#b55f5f]">*</span>}
      </span>

      {children}

      {hint && (
        <span className="mt-1.5 block text-xs leading-5 text-[#8a969e]">
          {hint}
        </span>
      )}
    </label>
  );
};

const ImageUpload = ({ slot, file, onChange, onRemove }) => {
  const previewUrl = useMemo(() => {
    if (!file) return "";
    if (typeof file === "string") return file;

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!file || typeof file === "string") {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  return (
    <div className="relative aspect-square">
      <label
        htmlFor={"productImage" + slot}
        className="group flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#cfd9d2] bg-[#f8faf8] text-center transition hover:border-[#7fa087] hover:bg-[#f1f7f2]"
      >
        <input
          id={"productImage" + slot}
          onChange={(event) => onChange(slot, event.target.files?.[0])}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={"Product preview " + slot}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex flex-col items-center px-3 text-[#71808a]">
            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#5e8767] shadow-sm">
              <ImagePlus size={19} />
            </span>

            <span className="text-xs font-medium">Add image {slot}</span>
          </span>
        )}
      </label>

      {file && (
        <button
          type="button"
          onClick={() => onRemove(slot)}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#9c5555] shadow transition hover:bg-[#fff0f0]"
          aria-label={"Remove image " + slot}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default AddProduct;
