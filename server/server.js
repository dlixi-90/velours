import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebhooks from "./controllers/ClerkWebhooks.js";
import userRouter from "./routes/userRoute.js";
import connectCloudinary from "./config/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import addressRouter from "./routes/addressRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import aiRouter from "./routes/aiRoute.js";

await connectDB(); // Establish connection to the database
await connectCloudinary(); //Setup cloudinary for image storage

const app = express(); // Initialize Express Application
app.use(cors()); // Enable Cross-Origin Resource sharing

// Middleware Setup
app.use(express.json()); //Enables JSON request body parsing
app.use(clerkMiddleware());

// API to listen Clerk Webhooks
app.use("/api/clerk", clerkWebhooks);

// Define API Routes
app.use("/api/users", userRouter); // Routes for User functionality
app.use("/api/products", productRouter); // Routes for handling products
app.use("/api/addresses", addressRouter); // Routes for handling addresses
app.use("/api/cart", cartRouter); // Routes for handling cart
app.use("/api/orders", orderRouter);
app.use("/api/ai", aiRouter); // Routes for handling order

// Route Endpoint to check API Status
app.get("/", (req, res) => {
  res.send("API Successfully connected");
});

const port = process.env.PORT || 3000; // Define server port

// Start the server
app.listen(port, () =>
  console.log(`Server is running at http://localhost:${port}`),
);
