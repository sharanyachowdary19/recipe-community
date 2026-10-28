const state = {
  recipes: [],
  categories: []
};

const elements = {
  form: document.getElementById("search-form"),
  search: document.getElementById("search"),
  category: document.getElementById("category"),
  maxTime: document.getElementById("max-time"),
  clear: document.getElementById("clear-search"),
  emptyClear: document.getElementById("empty-clear"),
  grid: document.getElementById("recipe-grid"),
  empty: document.getElementById("empty-state"),
  status: document.getElementById("status"),
  count: document.getElementById("result-count"),
  title: document.getElementById("results-title"),
  dialog: document.getElementById("recipe-dialog"),
  dialogContent: document.getElementById("dialog-content"),
  dialogClose: document.getElementById("dialog-close")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadRecipes();
  });

  elements.clear.addEventListener("click", clearFilters);
  elements.emptyClear.addEventListener("click", clearFilters);
  elements.dialogClose.addEventListener("click", () => elements.dialog.close());

  try {
    await loadCategories();
    await loadRecipes();
  } catch (error) {
    showStatus(error.message, true);
  }
}

async function loadCategories() {
  const response = await fetch("/api/categories");
  const data = await parseResponse(response);
  state.categories = data.categories;

  for (const category of state.categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.category.appendChild(option);
  }
}

async function loadRecipes() {
  showStatus("Finding recipes…");

  const params = new URLSearchParams();
  const search = elements.search.value.trim();
  const category = elements.category.value;
  const maxTime = elements.maxTime.value.trim();

  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (maxTime) params.set("maxTime", maxTime);

  try {
    const response = await fetch(`/api/recipes?${params.toString()}`);
    const data = await parseResponse(response);
    state.recipes = data.recipes;
    renderRecipes();
    elements.title.textContent = search || category || maxTime ? "Search results" : "All recipes";
    showStatus("");
  } catch (error) {
    state.recipes = [];
    renderRecipes();
    showStatus(error.message, true);
  }
}

function renderRecipes() {
  elements.grid.replaceChildren();
  elements.count.textContent = `${state.recipes.length} recipe${state.recipes.length === 1 ? "" : "s"}`;

  if (state.recipes.length === 0) {
    elements.empty.classList.remove("hidden");
    return;
  }

  elements.empty.classList.add("hidden");

  for (const recipe of state.recipes) {
    const card = document.createElement("article");
    card.className = "recipe-card";

    const visual = document.createElement("div");
    visual.className = "recipe-visual";
    visual.textContent = recipe.emoji || "🍽️";
    visual.setAttribute("aria-hidden", "true");

    const body = document.createElement("div");
    body.className = "recipe-card-body";

    const title = document.createElement("h3");
    title.textContent = recipe.name;

    const description = document.createElement("p");
    description.className = "recipe-description";
    description.textContent = recipe.description || "A tasty recipe to try.";

    const meta = document.createElement("div");
    meta.className = "recipe-meta";
    addPill(meta, recipe.category);
    addPill(meta, `${recipe.prep_time_minutes + recipe.cook_time_minutes} min`);
    addPill(meta, `${recipe.servings} servings`);

    const button = document.createElement("button");
    button.className = "primary-btn card-action";
    button.type = "button";
    button.textContent = "View recipe";
    button.addEventListener("click", () => openRecipe(recipe.id));

    body.append(title, description, meta, button);
    card.append(visual, body);
    elements.grid.appendChild(card);
  }
}

function addPill(parent, text) {
  const pill = document.createElement("span");
  pill.className = "meta-pill";
  pill.textContent = text;
  parent.appendChild(pill);
}

async function openRecipe(id) {
  showStatus("Loading recipe…");

  try {
    const response = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
    const data = await parseResponse(response);
    renderDialog(data.recipe);
    elements.dialog.showModal();
    showStatus("");
  } catch (error) {
    showStatus(error.message, true);
  }
}

function renderDialog(recipe) {
  elements.dialogContent.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "dialog-inner";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = recipe.category;

  const title = document.createElement("h2");
  title.id = "dialog-title";
  title.textContent = `${recipe.emoji || "🍽️"} ${recipe.name}`;

  const description = document.createElement("p");
  description.className = "dialog-description";
  description.textContent = recipe.description || "";

  const meta = document.createElement("div");
  meta.className = "recipe-meta";
  addPill(meta, `Prep: ${recipe.prep_time_minutes} min`);
  addPill(meta, `Cook: ${recipe.cook_time_minutes} min`);
  addPill(meta, `${recipe.servings} servings`);

  const detailGrid = document.createElement("div");
  detailGrid.className = "detail-grid";

  const ingredientSection = document.createElement("section");
  const ingredientTitle = document.createElement("h3");
  ingredientTitle.textContent = "Ingredients";
  const ingredientList = document.createElement("ul");
  ingredientList.className = "ingredients";

  for (const ingredient of recipe.ingredients) {
    const item = document.createElement("li");
    item.textContent = ingredient;
    ingredientList.appendChild(item);
  }
  ingredientSection.append(ingredientTitle, ingredientList);

  const stepsSection = document.createElement("section");
  const stepsTitle = document.createElement("h3");
  stepsTitle.textContent = "Method";
  const stepsList = document.createElement("ol");
  stepsList.className = "steps";

  for (const step of recipe.steps) {
    const item = document.createElement("li");
    item.textContent = step;
    stepsList.appendChild(item);
  }
  stepsSection.append(stepsTitle, stepsList);

  detailGrid.append(ingredientSection, stepsSection);
  wrapper.append(eyebrow, title, description, meta, detailGrid);
  elements.dialogContent.appendChild(wrapper);
}

function clearFilters() {
  elements.search.value = "";
  elements.category.value = "";
  elements.maxTime.value = "";
  loadRecipes();
  document.getElementById("recipes").scrollIntoView({ behavior: "smooth" });
}

async function parseResponse(response) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function showStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}
