const express = require("express");
const supabase = require("../supabase");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

const allowedCategories = new Set([
  "Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Vegetarian"
]);

function validateRecipe(input) {
  const errors = [];
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const ingredients = Array.isArray(input.ingredients)
    ? input.ingredients.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
  const steps = Array.isArray(input.steps)
    ? input.steps.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
  const prepTime = Number(input.prep_time_minutes);
  const cookTime = Number(input.cook_time_minutes);
  const servings = Number(input.servings);
  const emoji = typeof input.emoji === "string" ? input.emoji.trim().slice(0, 8) : "🍽️";

  if (name.length < 2 || name.length > 100) errors.push("Name must be 2–100 characters.");
  if (description.length > 500) errors.push("Description must be 500 characters or fewer.");
  if (!allowedCategories.has(category)) errors.push("Choose a valid category.");
  if (ingredients.length < 1 || ingredients.length > 50) errors.push("Add 1–50 ingredients.");
  if (steps.length < 1 || steps.length > 30) errors.push("Add 1–30 preparation steps.");
  if (!Number.isInteger(prepTime) || prepTime < 0 || prepTime > 600) errors.push("Preparation time must be 0–600 minutes.");
  if (!Number.isInteger(cookTime) || cookTime < 0 || cookTime > 1200) errors.push("Cooking time must be 0–1200 minutes.");
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) errors.push("Servings must be 1–100.");

  return {
    errors,
    value: {
      name, description, category, ingredients, steps,
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      servings, emoji
    }
  };
}

router.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const maxTimeRaw = req.query.maxTime;
    const maxTime = maxTimeRaw === undefined || maxTimeRaw === "" ? null : Number(maxTimeRaw);

    if (maxTime !== null && (!Number.isInteger(maxTime) || maxTime < 1 || maxTime > 1800)) {
      return res.status(400).json({ message: "maxTime must be a whole number between 1 and 1800." });
    }

    let query = supabase
      .from("recipes")
      .select("id,name,description,category,prep_time_minutes,cook_time_minutes,servings,emoji")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) {
      const safeSearch = search.replace(/[%_]/g, "\\$&");
      query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
    }

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw error;

    let recipes = data;
    if (maxTime !== null) {
      recipes = recipes.filter(
        (recipe) => recipe.prep_time_minutes + recipe.cook_time_minutes <= maxTime
      );
    }

    res.json({ recipes });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json({ recipe: data });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { errors, value } = validateRecipe(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const { data, error } = await supabase
      .from("recipes")
      .insert(value)
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json({ recipe: data });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { errors, value } = validateRecipe(req.body);
    if (errors.length) return res.status(400).json({ message: errors.join(" ") });

    const { data, error } = await supabase
      .from("recipes")
      .update(value)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    res.json({ recipe: data });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ message: "Recipe deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
