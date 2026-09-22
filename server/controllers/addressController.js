import Address from "../models/Address.js";

const addressFields = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "street",
  "city",
  "state",
  "zipcode",
  "country",
];
const addressFieldLimits = {
  firstName: 80,
  lastName: 80,
  email: 254,
  phone: 30,
  street: 200,
  city: 100,
  state: 100,
  zipcode: 20,
  country: 100,
};

// Add Address [POST '/add']
export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const { userId } = req.auth();

    const normalizedAddress = {};

    for (const field of addressFields) {
      const value = String(address?.[field] || "").trim();

      if (!value && field !== "zipcode") {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }

      if (value.length > addressFieldLimits[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is too long`,
        });
      }

      normalizedAddress[field] = value;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedAddress.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const createdAddress = await Address.create({
      ...normalizedAddress,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      address: createdAddress,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save address",
    });
  }
};

// Get Address [GET '/']
export const getAddress = async (req, res) => {
  try {
    const { userId } = req.auth();

    const addresses = await Address.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load addresses",
    });
  }
};
