
document.addEventListener("DOMContentLoaded", () => {
  // ---------- Config & Data ----------
  const STORAGE_KEY = "mealPlan";
  let mealPlan = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: []
  };

  // ---------- Cached DOM ----------
  const mealTypeSelect = document.getElementById("mealType");
  const mealInput = document.getElementById("mealInput");
  const addMealBtn = document.getElementById("addMealBtn");
  const mealList = document.getElementById("mealList");
  const clearBtn = document.getElementById("clearBtn");

  // Recipe search controls
  const searchInput = document.getElementById("recipe-search-input");
  const searchBtn = document.getElementById("searchBtn");
  const clearResultsBtn = document.getElementById("clearResultsBtn");
  const resultsDiv = document.getElementById("recipe-results");

  // Modal controls
  const recipeModal = document.getElementById("recipeModal");
  const recipeModalContent = document.getElementById("recipeModalContent");
  const recipeModalClose = document.getElementById("recipeModalClose");

  // Small reusable toast (non-blocking)
  function showToast(text, duration = 1800) {
    let toast = document.createElement("div");
    toast.className = "mini-toast";
    toast.textContent = text;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#222",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "6px",
      zIndex: 9999,
      opacity: "0",
      transition: "opacity 180ms ease"
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // ---------- Persistence ----------
  function savePlan() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mealPlan));
  }

  // ---------- Rendering ----------
  function renderMeals() {
    mealList.innerHTML = "";

    for (const type of Object.keys(mealPlan)) {
      const items = mealPlan[type];
      const group = document.createElement("section");
      group.className = "meal-group";

      const header = document.createElement("div");
      header.className = "meal-group-header";
      const title = document.createElement("h3");
      title.textContent = type;
      title.className = "meal-group-title";
      header.appendChild(title);

      // optional small count
      const count = document.createElement("span");
      count.className = "meal-count";
      count.textContent = ` (${items.length})`;
      title.appendChild(count);

      group.appendChild(header);

      const list = document.createElement("div");
      list.className = "meal-items";

      items.forEach(meal => {
        const row = document.createElement("div");
        row.className = "meal-item";
        row.dataset.id = meal.id;

        const textSpan = document.createElement("span");
        textSpan.className = "meal-text";
        textSpan.textContent = meal.name;

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "btn small";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => enterEditMode(type, meal, row, textSpan));

        // Delete button
        const delBtn = document.createElement("button");
        delBtn.className = "btn small danger";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          deleteMeal(type, meal.id);
          showToast("Meal deleted");
        });

        row.appendChild(textSpan);
        row.appendChild(editBtn);
        row.appendChild(delBtn);

        list.appendChild(row);
      });

      // If no items, show hint
      if (items.length === 0) {
        const hint = document.createElement("div");
        hint.className = "empty-hint";
        hint.textContent = "No meals yet — add or search recipes!";
        list.appendChild(hint);
      }

      group.appendChild(list);
      mealList.appendChild(group);
    }
  }

  // ---------- Meal CRUD ----------
  addMealBtn.addEventListener("click", () => {
    const type = mealTypeSelect.value;
    const name = mealInput.value.trim();
    if (!name) return showToast("Enter a meal name");

    const mealObj = { id: Date.now().toString(), name };
    mealPlan[type].push(mealObj);
    savePlan();
    mealInput.value = "";
    renderMeals();
    showToast("Meal added");
  });

  function deleteMeal(type, id) {
    mealPlan[type] = mealPlan[type].filter(m => m.id !== id);
    savePlan();
    renderMeals();
  }

  function enterEditMode(type, meal, rowElement, textSpan) {
    // If an edit input already exists elsewhere, cancel it first
    const existing = document.querySelector(".edit-input");
    if (existing) {
      existing.replaceWith(document.createTextNode(existing.value || ""));
    }

    const input = document.createElement("input");
    input.type = "text";
    input.value = meal.name;
    input.className = "edit-input";
    input.style.marginRight = "8px";
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") saveEdit();
      if (e.key === "Escape") cancelEdit();
    });

    function saveEdit() {
      const val = input.value.trim();
      if (!val) return showToast("Name cannot be empty");
      meal.name = val;
      savePlan();
      renderMeals();
      showToast("Saved");
    }

    function cancelEdit() {
      renderMeals();
    }

    // Replace text with input and focus
    rowElement.replaceChild(input, textSpan);
    input.focus();
    // Replace edit button behaviour with save
    const editBtn = rowElement.querySelector("button");
    if (editBtn) {
      editBtn.textContent = "Save";
      // temporary handler
      const saveHandler = () => saveEdit();
      editBtn.replaceWith(editBtn.cloneNode(true));
      const newEditBtn = rowElement.querySelector("button");
      newEditBtn.textContent = "Save";
      newEditBtn.className = "btn small";
      newEditBtn.addEventListener("click", saveHandler);
    }
  }

  // ---------- Clear Plan ----------
  clearBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear the whole plan?")) return;
    mealPlan = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
    savePlan();
    renderMeals();
    clearResults();
    showToast("Plan cleared");
  });

  // ---------- Recipe Search (TheMealDB) ----------
  async function searchRecipes() {
    const q = (searchInput.value || "").trim();
    if (!q) {
      resultsDiv.innerHTML = `<p class="muted">Please enter a search term.</p>`;
      return;
    }
    resultsDiv.innerHTML = `<p class="muted">Searching...</p>`;

    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.meals) {
        resultsDiv.innerHTML = `<p class="muted">No recipes found.</p>`;
        return;
      }
      displayRecipeResults(data.meals);
    } catch (err) {
      console.error(err);
      resultsDiv.innerHTML = `<p class="muted">Error fetching recipes.</p>`;
    }
  }

  function displayRecipeResults(meals) {
    resultsDiv.innerHTML = "";
    // container fixed height with scroll handled in CSS
    meals.forEach(meal => {
      const card = document.createElement("div");
      card.className = "recipe-card";

      const thumb = document.createElement("img");
      thumb.className = "recipe-thumb";
      thumb.src = meal.strMealThumb;
      thumb.alt = meal.strMeal;
      thumb.width = 90;
      thumb.height = 90;
      thumb.style.objectFit = "cover";
      thumb.style.borderRadius = "6px";
      thumb.style.cursor = "pointer";

      // clicking thumbnail opens modal with details
      thumb.addEventListener("click", () => showRecipeDetails(meal.idMeal));

      const title = document.createElement("div");
      title.className = "recipe-title";
      title.textContent = meal.strMeal;

      const actions = document.createElement("div");
      actions.className = "recipe-actions";

      const addBtn = document.createElement("button");
      addBtn.className = "btn small";
      addBtn.textContent = "Add to Plan";
      addBtn.addEventListener("click", () => {
        selectRecipe(meal.strMeal);
      });

      actions.appendChild(addBtn);

      card.appendChild(thumb);
      card.appendChild(title);
      card.appendChild(actions);

      resultsDiv.appendChild(card);
    });
  }

  function clearResults() {
    resultsDiv.innerHTML = "";
  }

  // Wire search + clear results buttons
  if (searchBtn) searchBtn.addEventListener("click", searchRecipes);
  if (clearResultsBtn) clearResultsBtn.addEventListener("click", () => {
    clearResults();
    showToast("Results cleared");
  });

  // ---------- Recipe Details Modal ----------
  async function showRecipeDetails(idMeal) {
    try {
      recipeModalContent.innerHTML = `<p class="muted">Loading...</p>`;
      recipeModal.style.display = "flex";

      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
      const data = await res.json();
      const meal = data.meals && data.meals[0];
      if (!meal) {
        recipeModalContent.innerHTML = `<p class="muted">Could not load recipe details.</p>`;
        return;
      }

      // build ingredients list
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const name = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (name && name.trim()) ingredients.push(`${name.trim()} — ${measure ? measure.trim() : ""}`);
      }

      // modal content with add-to-plan button
      recipeModalContent.innerHTML = `
        <div class="modal-header">
          <h2 class="modal-title">${escapeHtml(meal.strMeal)}</h2>
        </div>
        <img class="modal-thumb" src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}">
        <div class="modal-nutrition" id="modal-nutrition"></div>
        <h3>Ingredients</h3>
        <ul class="modal-ingredients">
          ${ingredients.map(it => `<li>${escapeHtml(it)}</li>`).join("")}
        </ul>
        <h3>Instructions</h3>
        <p class="modal-instructions">${escapeHtml(meal.strInstructions)}</p>
        <div style="margin-top:12px;">
          <button id="modal-add-to-plan" class="btn">Add to selected category</button>
          <button id="modal-close-btn" class="btn small">Close</button>
        </div>
      `;

      // hook modal buttons
      const modalAddBtn = document.getElementById("modal-add-to-plan");
      const modalCloseBtn = document.getElementById("modal-close-btn");

      modalAddBtn.addEventListener("click", () => {
        selectRecipe(meal.strMeal);
        showToast(`Added "${meal.strMeal}" to ${mealTypeSelect.value}`);
      });

      modalCloseBtn.addEventListener("click", () => {
        recipeModal.style.display = "none";
      });

      // clicking outside modal content closes it
      // (window onclick below handles it too)
    } catch (err) {
      console.error("showRecipeDetails error:", err);
      recipeModalContent.innerHTML = `<p class="muted">Error loading recipe details.</p>`;
    }
  }

  // Close modal icons/overlay
  if (recipeModalClose) {
    recipeModalClose.addEventListener("click", () => (recipeModal.style.display = "none"));
  }
  window.addEventListener("click", (ev) => {
    if (ev.target === recipeModal) recipeModal.style.display = "none";
  });

  // ---------- Add recipe to plan ----------
  function selectRecipe(recipeName) {
    const type = mealTypeSelect.value || "Breakfast";
    const mealObj = { id: Date.now().toString(), name: recipeName };
    mealPlan[type].push(mealObj);
    savePlan();
    renderMeals();
  }

  // ---------- Utilities ----------
  function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ---------- Initial Render ----------
  renderMeals();

  // expose debug helpers only in dev if needed:
  // window._mealPlan = mealPlan;
});
