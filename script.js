// Storage structure:
// { Breakfast: [], Lunch: [], Dinner: [], Snack: [] }

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

// Render the meals on screen
function renderMeals() {
    mealList.innerHTML = "";

    for (let type in mealPlan) {
        const meals = mealPlan[type];

        if (meals.length > 0) {
            const groupDiv = document.createElement("div");
            groupDiv.classList.add("meal-group");

            const title = document.createElement("h3");
            title.textContent = type;

            groupDiv.appendChild(title);

            meals.forEach(meal => {
                const item = document.createElement("div");
                item.classList.add("meal-item");
                item.textContent = "• " + meal;
                groupDiv.appendChild(item);
            });

            mealList.appendChild(groupDiv);
        }
    }
}

// Add a meal
addMealBtn.addEventListener("click", () => {
    const type = mealTypeSelect.value;
    const meal = mealInput.value.trim();

    if (meal === "") return;

    mealPlan[type].push(meal);

    localStorage.setItem("mealPlan", JSON.stringify(mealPlan));

    mealInput.value = "";
    renderMeals();
});

// Clear all meals
clearBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear the whole plan?")) return;

    mealPlan = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
    localStorage.setItem("mealPlan", JSON.stringify(mealPlan));
    renderMeals();
});

// Initial render
renderMeals();
