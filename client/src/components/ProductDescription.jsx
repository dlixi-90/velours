import { useState } from "react";
import { ChevronDown } from "lucide-react";

const getIngredientCopy = (product) => {
  if (Array.isArray(product.ingredients) && product.ingredients.length > 0) {
    return product.ingredients.join(", ");
  }

  if (typeof product.ingredients === "string" && product.ingredients.trim()) {
    return product.ingredients;
  }

  return "The complete ingredient list is printed on the product packaging. Please check the label before use if you have allergies or known sensitivities.";
};

const ProductDescription = ({ product, selectedSize }) => {
  const [openSection, setOpenSection] = useState("description");

  const sections = [
    {
      id: "description",
      label: "Description",
      content: (
        <p className="text-sm leading-6 text-[#697078]">
          {product.description}
        </p>
      ),
    },
    {
      id: "ingredients",
      label: "Ingredients",
      content: (
        <p className="text-sm leading-6 text-[#697078]">
          {getIngredientCopy(product)}
        </p>
      ),
    },
    {
      id: "size-guide",
      label: "Size guide",
      content: (
        <div>
          <p className="text-sm leading-6 text-[#697078]">
            Available in {product.sizes.join(", ")}.
            {selectedSize ? ` You are viewing the ${selectedSize} size.` : ""}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#92989d]">
            Choose a smaller size for travel or trial, and a larger size for
            regular use.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-[#dededb]">
      {sections.map((section) => {
        const isOpen = openSection === section.id;

        return (
          <div
            key={section.id}
            className="border-b border-[#dededb] last:border-b-0"
          >
            <button
              type="button"
              onClick={() => setOpenSection(isOpen ? null : section.id)}
              className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium text-[#343434] transition hover:bg-[#fafaf8]"
              aria-expanded={isOpen}
              aria-controls={`product-${section.id}`}
            >
              {section.label}
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div id={`product-${section.id}`} className="px-4 pb-4 pr-8">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProductDescription;
