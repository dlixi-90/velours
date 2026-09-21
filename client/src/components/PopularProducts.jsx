import Title from "./Title";
import { usePopularProducts } from "../hooks/usePopularProducts";
import Item from "./Item";

const PopularProducts = () => {
  const {
    popularProducts,
    popularProductsLoading,
    popularProductsError,
    fetchPopularProducts,
  } = usePopularProducts();
  return (
    <section className="max-padd-container">
      <Title title1={"Popular"} title2={"Products"} titleStyles={"pb-10"} />
      <p className="mb-6 text-sm text-gray-500">Top 4 by units sold · All time</p>
      {popularProductsError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {popularProductsError}{" "}
          <button type="button" onClick={fetchPopularProducts} className="underline">
            Retry
          </button>
        </p>
      )}
      {popularProductsLoading && <p role="status">Loading popular products...</p>}
      {!popularProductsLoading && !popularProductsError && !popularProducts.length && (
        <p className="text-sm text-gray-500">No sales yet.</p>
      )}
      {/* container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {popularProducts.map((product) => (
          <div key={product._id}>
            <Item product={product} collectionLayout />
            <p className="mt-2 text-center text-sm text-gray-500">{product.soldQuantity} sold</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularProducts;
