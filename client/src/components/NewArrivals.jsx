import { useMemo } from "react";
import Title from "./Title";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { useAppContext } from "../context/AppContext";
import Item from "./Item";

const NewArrivals = () => {
  const { products } = useAppContext();
  const newArrivals = useMemo(
    () => products.slice(0, 10),
    [products],
  );

  return (
    <section className="max-padd-container mt-28">
      <Title title1={"New"} title2={"Arrivals"} titleStyles={"pb-10"} />
      {/* Container */}
      <Swiper
        spaceBetween={30}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          555: {
            slidesPerView: 1,
          },
          600: {
            slidesPerView: 2,
          },
          1022: {
            slidesPerView: 3,
          },
          1350: {
            slidesPerView: 4,
          },
        }}
        modules={[Autoplay]}
        className="min-h-[399px]"
      >
        {newArrivals.map((product) => (
          <SwiperSlide key={product._id}>
            <Item product={product} collectionLayout />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default NewArrivals;
