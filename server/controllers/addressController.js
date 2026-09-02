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

// Add Address [POST '/add']
export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const { userId } = req.auth();

    const normalizedAddress = {};

    for (const field of addressFields) {
      const value = String(address?.[field] || "").trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }

      normalizedAddress[field] = value;
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
      message: error.message,
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
      message: error.message,
    });
  }
};
