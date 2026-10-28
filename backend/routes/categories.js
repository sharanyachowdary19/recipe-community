const express = require("express");
const supabase = require("../supabase");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select("category")
      .order("category");

    if (error) throw error;

    const categories = [...new Set(data.map((row) => row.category))];
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
