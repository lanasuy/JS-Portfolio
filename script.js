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

function savePlan() {
    localStorage.setItem("mealPlan", JSON.stringify(mealPlan));
}

// Render meals on screen
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
                const itemDiv = document.createElement("div");
                itemDiv.classList.add("meal-item");

                // Meal text
                const mealNameSpan = document.createElement("span");
                mealNameSpan.textContent = "• " + meal.name + " ";
                itemDiv.appendChild(mealNameSpan);

                // --- Edit button ---
                const editBtn = document.createElement("button");
                editBtn.textContent = "Edit";
                editBtn.style.marginRight = "8px";
                editBtn.addEventListener("click", () => {
                    enterEditMode(type, meal, mealNameSpan, editBtn);
                });
                itemDiv.appendChild(editBtn);

                // --- Delete button ---
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

// Edit mode
function enterEditMode(type, meal, spanElement, editBtn) {
    const input = document.createElement("input");
    input.value = meal.name;
    input.style.marginRight = "8px";

    // Replace the span with the input
    spanElement.replaceWith(input);

    // Change Edit → Save
    editBtn.textContent = "Save";

    // Remove old event listener by replacing onclick
    editBtn.onclick = () => {
        const newName = input.value.trim();
        if (!newName) return;

        // Update the object
        meal.name = newName;

        savePlan();
        renderMeals();
    };
}


clearBtn.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear the whole plan?")) return;

    mealPlan = { Breakfast: [], Lunch: [], Dinner: [], Snack: [] };
    savePlan();
    renderMeals();
});

// Initial render
renderMeals();

