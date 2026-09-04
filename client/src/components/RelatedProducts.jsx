import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Title from "./Title";
import Item from "./Item";
import { useAppContext } from "../context/AppContext";

const RelatedProducts = ({ product, productId }) => {
  const { products } = useAppContext();

  const relatedProducts = useMemo(
    () =>
      products
        .filter(
          (item) =>
            item.category === product.category && item._id !== productId,
        )
        .slice(0, 6),
    [product.category, productId, products],
  );

  if (relatedProducts.length === 0) return null;

  return (
    <section className="mt-20 sm:mt-24">
      <Title title1="Related" title2="Products" titleStyles="pb-10" />

      <Swiper
        spaceBetween={30}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          0: { slidesPerView: 1 },
          600: { slidesPerView: 2 },
          1022: { slidesPerView: 3 },
          1350: { slidesPerView: 4 },
        }}
        modules={[Autoplay]}
        className="min-h-[399px]"
      >
        {relatedProducts.map((item) => (
          <SwiperSlide key={item._id}>
            <Item product={item} collectionLayout />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default RelatedProducts;
