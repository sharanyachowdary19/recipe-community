require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const recipeRoutes = require("./routes/recipes");
const categoryRoutes = require("./routes/categories");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." }
});

app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Recipe Finder API is running." });
});

app.use("/api/recipes", recipeRoutes);
app.use("/api/categories", categoryRoutes);

const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "An unexpected server error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`Recipe Finder is running at http://localhost:${PORT}`);
});
