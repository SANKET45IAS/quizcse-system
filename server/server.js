const path = require("path");

const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

const connectDB = require("./config/db");
const questionRoutes = require("./routes/questionRoutes");

dotenv.config();

const app = express();
const uploadsPath = path.join(__dirname, "uploads");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/questions", questionRoutes);

app.use((error, _req, res, _next) => {
  if (error.name === "MulterError") {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: error.message || "Server error." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });

