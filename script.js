// Structure example:
// { Breakfast: [{id: 1, name: "Eggs"}], Lunch: [], Dinner: [], Snack: [] }

let mealPlan = JSON.parse(localStorage.getItem("mealPlan")) || {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: []
};

const mealTypeSelect = document.getElementById("mealType");
const mealInput = document.getElementById("mealInput");
const addMealBtn = document.getElementById("addMealBtn");
const mealList = document.getElementById("mealList");
const clearBtn = document.getElementById("clearBtn");

// Modal elements
const recipeModal = document.getElementById("recipeModal");
const recipeModalContent = document.getElementById("recipeModalContent");
const recipeModalClose = document.getElementById("recipeModalClose");

recipeModal.addEventListener("click", (e) => { //Close clicking outside of pop-up
    if (e.target === recipeModal) {
        recipeModal.style.display = "none";
    }
});

if (recipeModalClose) {
    recipeModalClose.addEventListener("click", () => {
        recipeModal.style.display = "none";
    });
}

function savePlan() {
    localStorage.setItem("mealPlan", JSON.stringify(mealPlan));
}

// Render meal plan
function renderMeals() {
    mealList.innerHTML = "";

    for (let type in mealPlan) {
        const meals = mealPlan[type];
        if (meals.length === 0) continue;

        const groupDiv = document.createElement("div");
        groupDiv.classList.add("meal-group");

        const title = document.createElement("h3");
        title.textContent = type;
        groupDiv.appendChild(title);

        meals.forEach(meal => {
            const itemDiv = document.createElement("div");
            itemDiv.classList.add("meal-item");

            // Make meal name clickable only if recipeId exists
            const mealName = meal.recipeId
                ? `<span class="clickable-meal" data-id="${meal.recipeId}">${meal.name}</span>`
                : meal.name;

            const mealNameSpan = document.createElement("span");
            mealNameSpan.innerHTML = "• " + mealName;
            itemDiv.appendChild(mealNameSpan);

            // Attach click handler if it has recipe data
            const clickable = mealNameSpan.querySelector(".clickable-meal");
            if (clickable) {
                clickable.addEventListener("click", () => {
                    showRecipeDetails(meal.recipeId);
                });
            }

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            itemDiv.appendChild(editBtn);

            editBtn.addEventListener("click", () => {
                enterEditMode(type, meal, mealNameSpan, editBtn);
            });

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener("click", () => {
                deleteMeal(type, meal.id);
            });
            itemDiv.appendChild(deleteBtn);

            groupDiv.appendChild(itemDiv);
        });

        mealList.appendChild(groupDiv);
    }
}

// Add meal
addMealBtn.addEventListener("click", () => {
    const type = mealTypeSelect.value;
    const name = mealInput.value.trim();
    if (!name) return;

    const mealObj = {
        id: Date.now(),
        name: name
    };

    mealPlan[type].push(mealObj);
    savePlan();
    mealInput.value = "";
    renderMeals();
});

// Delete meal
function deleteMeal(type, id) {
    mealPlan[type] = mealPlan[type].filter(m => m.id !== id);
    savePlan();
    renderMeals();
}

// Clear all meals
clearBtn.addEventListener("click", () => {
    if (!confirm("Clear the entire meal plan?")) return;

    mealPlan = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
    savePlan();
    renderMeals();

    document.getElementById("recipe-results").innerHTML = "";
});

// Edit mode
function enterEditMode(type, meal, spanElement, editBtn) {
    const input = document.createElement("input");
    input.value = meal.name;

    spanElement.replaceWith(input);
    editBtn.textContent = "Save";

    editBtn.onclick = () => {
        meal.name = input.value.trim();
        savePlan();
        renderMeals();
    };
}

// Initial render
renderMeals();

// Search recipes
async function searchRecipes() {
    const query = document.getElementById("recipe-search-input").value.trim();
    const resultsDiv = document.getElementById("recipe-results");

    if (!query) {
        resultsDiv.innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.meals) {
            resultsDiv.innerHTML = "<p>No results found.</p>";
            return;
        }

        displayRecipeResults(data.meals);
    } catch (err) {
        resultsDiv.innerHTML = "<p>Error loading recipes.</p>";
    }
}

function displayRecipeResults(meals) {
    const resultsDiv = document.getElementById("recipe-results");
    resultsDiv.innerHTML = "";

    meals.forEach(meal => {
        const div = document.createElement("div");
        div.className = "recipe-card";

        // Store meal.idMeal so we can show details later
        div.innerHTML = `
            <h4>${meal.strMeal}</h4>
            <img src="${meal.strMealThumb}" 
                 class="recipe-thumb"
                 onclick="showRecipeDetails('${meal.idMeal}')">

            <button onclick="selectRecipe('${meal.strMeal.replace(/'/g, "\\'")}', '${meal.idMeal}')">
                Add to Meal Plan
            </button>
        `;

        resultsDiv.appendChild(div);
    });
}

// Fetch full recipe
async function showRecipeDetails(idMeal) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
        const data = await res.json();
        const meal = data.meals[0];

        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ing && ing.trim()) ingredients.push(`${ing} - ${measure}`);
        }

        recipeModalContent.innerHTML = `
            <h2>${meal.strMeal}</h2>
            <img src="${meal.strMealThumb}" width="300">
            <h3>Ingredients</h3>
            <ul>${ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
            <h3>Instructions</h3>
            <p>${meal.strInstructions}</p>
            <button id="modalCloseBtn">Close</button> 

        `;
        document.getElementById("modalCloseBtn").addEventListener("click", () => {     //Close with X
            recipeModal.style.display = "none";
        });

        
        recipeModal.style.display = "flex";
    } catch {
        alert("Error loading recipe details.");
    }
}


function selectRecipe(recipeName, recipeId) {
    const type = mealTypeSelect.value;

    const mealObj = {
        id: Date.now(),
        name: recipeName,
        recipeId: recipeId
    };

    mealPlan[type].push(mealObj);
    savePlan();
    renderMeals();
}

// Attach search buttons
document.getElementById("searchBtn").addEventListener("click", searchRecipes);
document.getElementById("clearResultsBtn").addEventListener("click", () => {
    document.getElementById("recipe-results").innerHTML = "";
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && recipeModal.style.display === "flex") {  //close with esc key
        recipeModal.style.display = "none";
    }
});


// Expose modal functions globally
window.showRecipeDetails = showRecipeDetails;
window.selectRecipe = selectRecipe;





