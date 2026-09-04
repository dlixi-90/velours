import { assets } from "../assets/data";

const ProductFeatures = () => {
  return (
    <div className="mt-12 bg-primary rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 rounded-xl">
        <div className="flexCenter gap-x-4 p-2 rounded-3xl">
          <div>
            <img
              src={assets.returnRequest}
              alt=""
              width={77}
              className="mb-3"
            />
          </div>
          <div>
            <h5 className="h4 capitalize mb-2">Easy Return</h5>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Voluptatem eaque corrupti asperiores animi, praesentium
              temporibus!
            </p>
          </div>
        </div>

        <div className="flexCenter gap-x-4 p-2 rounded-3xl">
          <div>
            <img
              src={assets.secure}
              alt=""
              width={77}
              className="mb-3 text-blue-500"
            />
          </div>
          <div>
            <h5 className="h4 capitalize mb-2">secure payment</h5>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Voluptatem eaque corrupti asperiores animi, praesentium
              temporibus!
            </p>
          </div>
        </div>

        <div className="flexCenter gap-x-4 p-2 rounded-3xl">
          <div>
            <img src={assets.delivery} alt="" width={77} className="mb-3" />
          </div>
          <div>
            <h5 className="h4 capitalize mb-2">Fast Delivery</h5>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Voluptatem eaque corrupti asperiores animi, praesentium
              temporibus!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFeatures;
