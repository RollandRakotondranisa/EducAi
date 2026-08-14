const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "EduAI Backend fonctionne correctement",
  });
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

module.exports = app;