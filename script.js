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

                // We will define the handler separately so we can remove it later
                function handleEditClick() {
                    enterEditMode(type, meal, mealNameSpan, editBtn, handleEditClick);
                }

                editBtn.addEventListener("click", handleEditClick);

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
function enterEditMode(type, meal, spanElement, editBtn, originalHandler) {
    const input = document.createElement("input");
    input.value = meal.name;
    input.style.marginRight = "8px";

    // Replace span with input
    spanElement.replaceWith(input);

    // Remove the edit listener so it doesn't fire again
    editBtn.removeEventListener("click", originalHandler);

    // Switch button text to Save
    editBtn.textContent = "Save";

    editBtn.onclick = () => {
        const newName = input.value.trim();
        if (!newName) return;

        meal.name = newName;
        savePlan();

        // After saving, restore original behavior
        editBtn.onclick = null; // clear save
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", originalHandler);

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


