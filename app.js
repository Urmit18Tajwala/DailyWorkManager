// ==========================================
// WorkLog
// Daily Work & Time Tracker
// ==========================================

// ==========================================
// DEFAULT CATEGORIES
// ==========================================

const DEFAULT_CATEGORIES = [
    {
        id: "development",
        name: "Development",
        color: "#6366f1"
    },
    {
        id: "testing",
        name: "Testing",
        color: "#22c55e"
    },
    {
        id: "meeting",
        name: "Meetings",
        color: "#f97316"
    },
    {
        id: "documentation",
        name: "Documentation",
        color: "#a855f7"
    },
    {
        id: "learning",
        name: "Learning",
        color: "#06b6d4"
    }
];

// ==========================================
// LOAD DATA
// ==========================================

let activities =
    JSON.parse(localStorage.getItem("worklog_activities")) || [];

let categories =
    JSON.parse(localStorage.getItem("worklog_categories")) || DEFAULT_CATEGORIES;

// ==========================================
// CURRENT DATES
// ==========================================

let selectedDate = new Date();
let reportWeekDate = new Date();

// ==========================================
// DOM ELEMENTS
// ==========================================

const selectedDateInput = document.getElementById("selectedDate");
const currentDateText = document.getElementById("currentDateText");
const activityList = document.getElementById("activityList");
const categorySummary = document.getElementById("categorySummary");
const totalHours = document.getElementById("totalHours");
const totalActivities = document.getElementById("totalActivities");
const usedCategories = document.getElementById("usedCategories");
const averageActivity = document.getElementById("averageActivity");
const activityModal = document.getElementById("activityModal");
const activityForm = document.getElementById("activityForm");
const activityId = document.getElementById("activityId");
const activityTitle = document.getElementById("activityTitle");
const activityCategory = document.getElementById("activityCategory");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");
const activityNotes = document.getElementById("activityNotes");
const durationPreview = document.getElementById("durationPreview");

// ==========================================
// SAVE DATA
// ==========================================

function saveData() {
    localStorage.setItem("worklog_activities", JSON.stringify(activities));
    localStorage.setItem("worklog_categories", JSON.stringify(categories));
}

// ==========================================
// DATE HELPERS
// ==========================================

function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatShortDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

// ==========================================
// TIME HELPERS
// ==========================================

function timeToMinutes(time) {
    const parts = time.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
}

function calculateDuration(start, end) {
    let startMinutes = timeToMinutes(start);
    let endMinutes = timeToMinutes(end);

    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }

    return endMinutes - startMinutes;
}

function formatMinutes(minutes) {
    if (!minutes || minutes <= 0) return "0m";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

function formatTime(time) {
    const [hour, minute] = time.split(":");
    const date = new Date();
    date.setHours(Number(hour), Number(minute));

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}

// ==========================================
// CATEGORY HELPER
// ==========================================

function getCategory(id) {
    return categories.find(category => category.id === id);
}

// ==========================================
// DASHBOARD
// ==========================================

function renderDashboard() {
    const dateString = dateToString(selectedDate);

    selectedDateInput.value = dateString;
    currentDateText.textContent = formatDate(selectedDate);

    const dayActivities = activities
        .filter(activity => activity.date === dateString)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    renderActivities(dayActivities);
    renderStats(dayActivities);
    renderCategorySummary(dayActivities);
}

// ==========================================
// RENDER ACTIVITIES
// ==========================================

function renderActivities(dayActivities) {
    if (dayActivities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px; margin-bottom:10px;">📝</div>
                <strong>No activities recorded</strong>
                <p style="margin-top:6px;">Start tracking your work by adding an activity.</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = dayActivities
        .map(activity => {
            const category = getCategory(activity.categoryId);
            const duration = calculateDuration(activity.startTime, activity.endTime);

            return `
                <div class="activity">
                    <div class="activity-time">
                        ${formatTime(activity.startTime)}<br>${formatTime(activity.endTime)}
                    </div>
                    <div class="activity-color" style="background: ${category?.color || "#6366f1"};"></div>
                    <div>
                        <div class="activity-title">${escapeHtml(activity.title)}</div>
                        <select
                            class="activity-category-select"
                            onchange="changeActivityCategory('${activity.id}', this.value)"
                        >
                            ${categories
                                .map(cat => `
                                    <option value="${cat.id}" ${cat.id === activity.categoryId ? "selected" : ""}>
                                        ${escapeHtml(cat.name)}
                                    </option>
                                `)
                                .join("")}
                        </select>
                        ${activity.notes ? `<div class="activity-notes">${escapeHtml(activity.notes)}</div>` : ""}
                        <div class="activity-actions">
                            <button class="action-btn" onclick="editActivity('${activity.id}')">Edit</button>
                            <button class="action-btn delete-btn" onclick="deleteActivity('${activity.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="activity-duration">${formatMinutes(duration)}</div>
                </div>
            `;
        })
        .join("");
}

// ==========================================
// CHANGE CATEGORY DIRECTLY
// ==========================================

window.changeActivityCategory = function (id, newCategoryId) {
    const activity = activities.find(item => item.id === id);
    if (!activity) return;

    activity.categoryId = newCategoryId;
    saveData();
    renderDashboard();
    renderWeeklyReport();
};

// ==========================================
// DASHBOARD STATS
// ==========================================

function renderStats(dayActivities) {
    const total = dayActivities.reduce((sum, activity) => {
        return sum + calculateDuration(activity.startTime, activity.endTime);
    }, 0);

    totalHours.textContent = formatMinutes(total);
    totalActivities.textContent = dayActivities.length;

    const categorySet = new Set(dayActivities.map(activity => activity.categoryId));
    usedCategories.textContent = categorySet.size;

    const average = dayActivities.length ? Math.round(total / dayActivities.length) : 0;
    averageActivity.textContent = formatMinutes(average);
}

// ==========================================
// CATEGORY SUMMARY
// ==========================================

function renderCategorySummary(dayActivities) {
    const totals = {};

    dayActivities.forEach(activity => {
        const duration = calculateDuration(activity.startTime, activity.endTime);
        totals[activity.categoryId] = (totals[activity.categoryId] || 0) + duration;
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);

    if (!total) {
        categorySummary.innerHTML = `<div class="empty-state">No category data yet.</div>`;
        return;
    }

    categorySummary.innerHTML = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([categoryId, minutes]) => {
            const category = getCategory(categoryId);
            const percentage = Math.round((minutes / total) * 100);

            return `
                <div class="category-row">
                    <div class="category-info">
                        <span class="category-name">${escapeHtml(category?.name || "Unknown")}</span>
                        <span class="category-time">${formatMinutes(minutes)} (${percentage}%)</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${percentage}%; background: ${category?.color || "#6366f1"};"></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

// ==========================================
// OPEN MODAL
// ==========================================

function openModal(activity = null) {
    if (categories.length === 0) {
        alert("Please add at least one category before logging activities.");
        return;
    }

    activityModal.classList.remove("hidden");
    populateCategorySelect();

    if (activity) {
        document.getElementById("modalTitle").textContent = "Edit Activity";
        activityId.value = activity.id;
        activityTitle.value = activity.title;
        activityCategory.value = activity.categoryId;
        startTime.value = activity.startTime;
        endTime.value = activity.endTime;
        activityNotes.value = activity.notes || "";
        updateDurationPreview();
    } else {
        document.getElementById("modalTitle").textContent = "Add Activity";
        activityForm.reset();
        activityId.value = "";
        startTime.value = "09:00";
        endTime.value = "10:00";
        updateDurationPreview();
    }
}

// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal() {
    activityModal.classList.add("hidden");
}

// ==========================================
// CATEGORY DROPDOWN
// ==========================================

function populateCategorySelect() {
    activityCategory.innerHTML = categories
        .map(category => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
        .join("");
}

// ==========================================
// SAVE ACTIVITY
// ==========================================

activityForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = activityTitle.value.trim();
    const categoryId = activityCategory.value;
    const start = startTime.value;
    const end = endTime.value;

    if (!title) {
        alert("Please enter an activity.");
        return;
    }

    const duration = calculateDuration(start, end);
    if (duration <= 0) {
        alert("Activity duration must be greater than zero.");
        return;
    }

    const dateString = dateToString(selectedDate);
    const currentId = activityId.value;

    const hasOverlap = activities.some(activity => {
        if (activity.date !== dateString) return false;
        if (activity.id === currentId) return false;
        return activitiesOverlap(start, end, activity.startTime, activity.endTime);
    });

    if (hasOverlap) {
        const proceed = confirm("This activity overlaps with another activity. Do you want to save it anyway?");
        if (!proceed) return;
    }

    if (currentId) {
        const index = activities.findIndex(activity => activity.id === currentId);
        if (index !== -1) {
            activities[index] = {
                ...activities[index],
                title,
                categoryId,
                startTime: start,
                endTime: end,
                notes: activityNotes.value.trim()
            };
        }
    } else {
        activities.push({
            id: Date.now().toString(),
            date: dateString,
            title,
            categoryId,
            startTime: start,
            endTime: end,
            notes: activityNotes.value.trim()
        });
    }

    saveData();
    closeModal();
    renderDashboard();
    renderWeeklyReport();
});

// ==========================================
// OVERLAP CHECK
// ==========================================

function activitiesOverlap(startA, endA, startB, endB) {
    const start1 = timeToMinutes(startA);
    const end1 = timeToMinutes(endA);
    const start2 = timeToMinutes(startB);
    const end2 = timeToMinutes(endB);

    return start1 < end2 && end1 > start2;
}

// ==========================================
// EDIT / DELETE ACTIVITY
// ==========================================

window.editActivity = function (id) {
    const activity = activities.find(item => item.id === id);
    if (activity) openModal(activity);
};

window.deleteActivity = function (id) {
    if (!confirm("Delete this activity?")) return;

    activities = activities.filter(activity => activity.id !== id);
    saveData();
    renderDashboard();
    renderWeeklyReport();
};

// ==========================================
// DURATION PREVIEW
// ==========================================

function updateDurationPreview() {
    const start = startTime.value;
    const end = endTime.value;

    if (!start || !end) {
        durationPreview.textContent = "0m";
        return;
    }

    const duration = calculateDuration(start, end);
    durationPreview.textContent = formatMinutes(duration);
}

startTime.addEventListener("change", updateDurationPreview);
endTime.addEventListener("change", updateDurationPreview);

// ==========================================
// NAVIGATION
// ==========================================

document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".nav-item[data-page]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        showPage(button.dataset.page);
    });
});

function showPage(page) {
    document.getElementById("dashboardPage").classList.add("hidden");
    document.getElementById("reportsPage").classList.add("hidden");
    document.getElementById("categoriesPage").classList.add("hidden");

    if (page === "dashboard") {
        document.getElementById("dashboardPage").classList.remove("hidden");
        renderDashboard();
    }
    if (page === "reports") {
        document.getElementById("reportsPage").classList.remove("hidden");
        renderWeeklyReport();
    }
    if (page === "categories") {
        document.getElementById("categoriesPage").classList.remove("hidden");
        renderCategories();
    }
}

// ==========================================
// DATE NAVIGATION
// ==========================================

selectedDateInput.addEventListener("change", function () {
    selectedDate = new Date(this.value + "T00:00:00");
    renderDashboard();
});

document.getElementById("previousDay").addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    renderDashboard();
});

document.getElementById("nextDay").addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    renderDashboard();
});

document.getElementById("todayBtn").addEventListener("click", () => {
    selectedDate = new Date();
    renderDashboard();
});

// ==========================================
// MODAL EVENTS
// ==========================================

document.getElementById("addActivityBtn").addEventListener("click", () => openModal());
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
activityModal.addEventListener("click", event => {
    if (event.target === activityModal) closeModal();
});

// ==========================================
// CATEGORIES (ADD / RENDER / DELETE)
// ==========================================

document.getElementById("addCategoryBtn").addEventListener("click", addCategory);

function addCategory() {
    const input = document.getElementById("newCategory");
    const color = document.getElementById("categoryColor");
    const name = input.value.trim();

    if (!name) {
        alert("Enter a category name.");
        return;
    }

    const exists = categories.some(
        category => category.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        alert("This category already exists.");
        return;
    }

    categories.push({
        id: "category-" + Date.now(),
        name,
        color: color.value
    });

    saveData();
    input.value = "";
    renderCategories();
    populateCategorySelect();
    renderDashboard();
}

function renderCategories() {
    const container = document.getElementById("categoryList");

    if (categories.length === 0) {
        container.innerHTML = `<div class="empty-state">No categories available. Please add one above.</div>`;
        return;
    }

    container.innerHTML = categories
        .map(
            category => `
                <div class="category-item">
                    <div class="category-left">
                        <span class="category-dot" style="background: ${category.color};"></span>
                        <span>${escapeHtml(category.name)}</span>
                    </div>
                    <button class="action-btn delete-btn" onclick="deleteCategory('${category.id}')">
                        Delete
                    </button>
                </div>
            `
        )
        .join("");
}

window.deleteCategory = function (id) {
    if (categories.length <= 1) {
        alert("You must keep at least one category.");
        return;
    }

    const targetCategory = categories.find(c => c.id === id);
    const affectedActivities = activities.filter(a => a.categoryId === id);

    if (affectedActivities.length > 0) {
        const confirmReassign = confirm(
            `"${targetCategory?.name}" is used by ${affectedActivities.length} activity/activities. Deleting it will reassign them to another category. Proceed?`
        );
        if (!confirmReassign) return;

        // Reassign to any other existing category
        const fallback = categories.find(c => c.id !== id);
        activities.forEach(activity => {
            if (activity.categoryId === id) {
                activity.categoryId = fallback.id;
            }
        });
    } else {
        if (!confirm(`Delete category "${targetCategory?.name}"?`)) return;
    }

    categories = categories.filter(category => category.id !== id);

    saveData();
    renderCategories();
    populateCategorySelect();
    renderDashboard();
    renderWeeklyReport();
};

// ==========================================
// WEEK HELPERS & REPORTS
// ==========================================

function getStartOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

function renderWeeklyReport() {
    const weekStart = getStartOfWeek(reportWeekDate);
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDates.push(date);
    }

    const weekEnd = weekDates[6];
    document.getElementById("weekRange").textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;

    const weeklyActivities = activities.filter(activity =>
        weekDates.some(date => dateToString(date) === activity.date)
    );

    const total = weeklyActivities.reduce((sum, activity) => {
        return sum + calculateDuration(activity.startTime, activity.endTime);
    }, 0);

    const workedDays = new Set(weeklyActivities.map(activity => activity.date)).size;

    document.getElementById("weeklyTotal").textContent = formatMinutes(total);
    document.getElementById("daysWorked").textContent = workedDays;
    document.getElementById("weeklyActivities").textContent = weeklyActivities.length;

    const dailyAverage = workedDays ? Math.round(total / workedDays) : 0;
    document.getElementById("dailyAverage").textContent = formatMinutes(dailyAverage);

    renderDailyReport(weekDates);
    renderWeeklyCategories(weeklyActivities);
}

function renderDailyReport(weekDates) {
    const container = document.getElementById("dailyReport");
    const dailyTotals = weekDates.map(date => {
        const dateString = dateToString(date);
        return {
            date,
            minutes: activities
                .filter(activity => activity.date === dateString)
                .reduce((sum, activity) => sum + calculateDuration(activity.startTime, activity.endTime), 0)
        };
    });

    const max = Math.max(...dailyTotals.map(day => day.minutes), 1);

    container.innerHTML = dailyTotals
        .map(day => {
            const percentage = Math.round((day.minutes / max) * 100);
            return `
                <div class="report-row">
                    <div class="report-row-header">
                        <span>${day.date.toLocaleDateString("en-US", { weekday: "long" })}</span>
                        <strong>${formatMinutes(day.minutes)}</strong>
                    </div>
                    <div class="report-bar">
                        <div class="report-bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

function renderWeeklyCategories(weeklyActivities) {
    const container = document.getElementById("weeklyCategoryReport");
    const totals = {};

    weeklyActivities.forEach(activity => {
        const duration = calculateDuration(activity.startTime, activity.endTime);
        totals[activity.categoryId] = (totals[activity.categoryId] || 0) + duration;
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);

    if (!total) {
        container.innerHTML = `<div class="empty-state">No data for this week.</div>`;
        return;
    }

    container.innerHTML = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([categoryId, minutes]) => {
            const category = getCategory(categoryId);
            const percentage = Math.round((minutes / total) * 100);

            return `
                <div class="report-row">
                    <div class="report-row-header">
                        <span>${escapeHtml(category?.name || "Unknown")}</span>
                        <strong>${formatMinutes(minutes)}</strong>
                    </div>
                    <div class="report-bar">
                        <div class="report-bar-fill" style="width: ${percentage}%; background: ${category?.color || "#6366f1"};"></div>
                    </div>
                </div>
            `;
        })
        .join("");
}

document.getElementById("previousWeek").addEventListener("click", () => {
    reportWeekDate.setDate(reportWeekDate.getDate() - 7);
    renderWeeklyReport();
});

document.getElementById("nextWeek").addEventListener("click", () => {
    reportWeekDate.setDate(reportWeekDate.getDate() + 7);
    renderWeeklyReport();
});

// ==========================================
// ESCAPE HTML & INITIALIZE
// ==========================================

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

renderDashboard();
renderCategories();
renderWeeklyReport();
populateCategorySelect();
updateDurationPreview();
