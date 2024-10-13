// Function to get and display the current day and time
function displayCurrentDayTime() {
    const currentDateTime = new Date();

    // Get day of the week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[currentDateTime.getDay()];

    // Get hours, minutes, and AM/PM
    let hours = currentDateTime.getHours();
    const minutes = currentDateTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert 24-hour format to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12;  // '0' hours should be '12'

    // Format time string
    const currentTime = `${hours}:${minutes} ${ampm}`;

    // Display the day and time in the navbar
    document.getElementById('current-day-time').textContent = `${currentDay}, ${currentTime}`;
}

// Initial display when the page loads
displayCurrentDayTime();

// Update the day and time every minute
setInterval(displayCurrentDayTime, 60000);  // Update every 60 seconds


// Dark Mode Toggle Functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

function setDarkMode(isDark) {
    if (isDark) {
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
        darkModeToggle.textContent = '🌞';  // Sun icon for light mode
    } else {
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
        darkModeToggle.textContent = '🌙';  // Moon icon for dark mode
    }
}

// Check the saved preference in localStorage
const savedMode = localStorage.getItem('darkMode');
if (savedMode) {
    setDarkMode(savedMode === 'dark');
} else {
    // Default to light mode
    setDarkMode(false);
}

// Event listener to toggle dark mode
darkModeToggle.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-mode');
    setDarkMode(!isDark);
    localStorage.setItem('darkMode', !isDark ? 'dark' : 'light');
});


// Data structure to store subjects for each day
let timetable = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: []
};

let goals = []; // Array to store goals
let editingIndex = -1;  // Tracks the index of the subject being edited

// Load timetable and goals from localStorage on page load
window.onload = function() {
    const savedTimetable = localStorage.getItem('timetable');
    const savedGoals = localStorage.getItem('goals');
    
    if (savedTimetable) {
        timetable = JSON.parse(savedTimetable);
        showDay('monday');  // Display Monday timetable by default
    }
    
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
        displayGoals();  // Display saved goals
    }
};

// Populate hour, minute, and AM/PM dropdowns
function populateTimeDropdowns() {
    const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);  // 1 to 12
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i < 10 ? `0${i}` : `${i}`);  // 00 to 59

    // Populate hour dropdowns
    const startHourSelect = document.getElementById('start-hour');
    const endHourSelect = document.getElementById('end-hour');
    hourOptions.forEach(hour => {
        const option = document.createElement('option');
        option.value = hour;
        option.textContent = hour;
        startHourSelect.appendChild(option.cloneNode(true));
        endHourSelect.appendChild(option.cloneNode(true));
    });

    // Populate minute dropdowns
    const startMinuteSelect = document.getElementById('start-minute');
    const endMinuteSelect = document.getElementById('end-minute');
    minuteOptions.forEach(minute => {
        const option = document.createElement('option');
        option.value = minute;
        option.textContent = minute;
        startMinuteSelect.appendChild(option.cloneNode(true));
        endMinuteSelect.appendChild(option.cloneNode(true));
    });
}

// Function to show subjects for the selected day
function showDay(day) {
    const tableBody = document.getElementById('timetable-body');
    const dayColumn = document.getElementById('day-column');
    
    dayColumn.innerHTML = day.charAt(0).toUpperCase() + day.slice(1);  // Update column header
    tableBody.innerHTML = '';  // Clear previous table rows
    
    // Populate the table with subjects for the selected day
    timetable[day].forEach((entry, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${entry.time}</td>
            <td>${entry.subject}</td>
            <td>
                <button class="edit-btn" onclick="editSubject('${day}', ${index})">✏️</button>
                <button class="delete-btn" onclick="deleteSubject('${day}', ${index})">🗑️</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Handle form submission for adding or editing subjects
function handleFormSubmit(event) {
    event.preventDefault();  // Prevent default form submission

    const day = document.getElementById('day').value;
    
    // Get start and end times from dropdowns
    const startTime = `${document.getElementById('start-hour').value}:${document.getElementById('start-minute').value} ${document.getElementById('start-ampm').value}`;
    const endTime = `${document.getElementById('end-hour').value}:${document.getElementById('end-minute').value} ${document.getElementById('end-ampm').value}`;
    
    const subject = document.getElementById('subject').value;
    
    // Create time range string
    const timeRange = `${startTime} - ${endTime}`;

    const newEntry = { time: timeRange, subject };

    if (editingIndex === -1) {
        // Add new subject
        timetable[day].push(newEntry);
    } else {
        // Edit existing subject
        timetable[day][editingIndex] = newEntry;
        editingIndex = -1;  // Reset editing index
        document.getElementById('submit-btn').innerText = 'Add Subject';  // Reset button text
    }

    // Reset form
    document.getElementById('subject-form').reset();

    // Save updated timetable to localStorage
    localStorage.setItem('timetable', JSON.stringify(timetable));

    // Show updated timetable for the current day
    showDay(day);
}

// Edit a subject
function editSubject(day, index) {
    editingIndex = index;
    const subjectData = timetable[day][index];

    const [start, end] = subjectData.time.split(' - ');
    const [startHour, startMinute] = start.split(':');
    const startAmpm = start.slice(-2);
    const [endHour, endMinute] = end.split(':');
    const endAmpm = end.slice(-2);
    
    document.getElementById('day').value = day;
    document.getElementById('start-hour').value = startHour;
    document.getElementById('start-minute').value = startMinute.slice(0, 2);
    document.getElementById('start-ampm').value = startAmpm;
    document.getElementById('end-hour').value = endHour;
    document.getElementById('end-minute').value = endMinute.slice(0, 2);
    document.getElementById('end-ampm').value = endAmpm;
    document.getElementById('subject').value = subjectData.subject;

    document.getElementById('submit-btn').innerText = 'Edit Subject';
}

// Delete a subject
function deleteSubject(day, index) {
    timetable[day].splice(index, 1);
    localStorage.setItem('timetable', JSON.stringify(timetable));  // Save updated timetable to localStorage
    showDay(day);  // Refresh timetable display
}

// Initialize the goals array and handle persistence
function addGoal(event) {
    event.preventDefault(); // Prevent form submission

    const newGoalInput = document.getElementById('new-goal');
    const newGoal = newGoalInput.value.trim(); // Get and trim the goal text

    if (newGoal) {
        goals.push(newGoal);  // Add new goal to the goals array

        // Reset the input field
        newGoalInput.value = '';

        // Save goals to localStorage
        localStorage.setItem('goals', JSON.stringify(goals));

        // Display the updated goals list
        displayGoals();
    }
}

// Function to display goals
function displayGoals() {
    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = ''; // Clear the current list

    // Loop through each goal and create list items with edit and delete buttons
    goals.forEach((goal, index) => {
        const listItem = document.createElement('li');
        
        listItem.innerHTML = `
            <span class="goal-text">${goal}</span>
            <div class="actions">
                <button class="edit-btn" onclick="editGoal(${index})">✏️</button>
                <button class="delete-btn" onclick="deleteGoal(${index})">🗑️</button>
            </div>
        `;
        
        goalsList.appendChild(listItem); // Add the goal item to the list
    });
}

// Edit a goal
function editGoal(index) {
    const newGoal = prompt("Edit your goal:", goals[index]);
    
    if (newGoal !== null && newGoal.trim() !== '') {
        goals[index] = newGoal.trim(); // Update the goal

        // Save updated goals to localStorage
        localStorage.setItem('goals', JSON.stringify(goals));

        displayGoals(); // Refresh the goals list
    }
}

// Delete a goal
function deleteGoal(index) {
    goals.splice(index, 1);  // Remove the goal from the array

    // Save updated goals to localStorage
    localStorage.setItem('goals', JSON.stringify(goals));

    displayGoals();  // Refresh the goals list
}


// Populate time dropdowns on page load
populateTimeDropdowns();
showDay('monday');  // Show Monday timetable by default
