import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import todoRoutes from "./routes/todo.route.js";
import dotenv from "dotenv";
import connnectDB from "./utils/db.config.js";
import userRouter from "./routes/user.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/todos", todoRoutes);
app.use("/api/user", userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    success: false,
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connnectDB();
});
