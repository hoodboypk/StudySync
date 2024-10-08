// Data structure to store subjects for each day
let timetable = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: []
};

let editingIndex = -1;  // Tracks the index of the subject being edited

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
                <button class="edit-btn" onclick="editSubject('${day}', ${index})">Edit</button>
                <button class="delete-btn" onclick="deleteSubject('${day}', ${index})">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Handle form submission for adding or editing subjects
function handleFormSubmit(event) {
    event.preventDefault();  // Prevent default form submission

    const day = document.getElementById('day').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const subject = document.getElementById('subject').value;

    // Create a time range string
    const timeRange = `${startTime} - ${endTime}`;

    const newEntry = { time: timeRange, subject };

    if (editingIndex === -1) {
        // Add new subject
        timetable[day].push(newEntry);
    } else {
        // Edit existing subject
        timetable[day][editingIndex] = newEntry;
        editingIndex = -1;
        document.getElementById('submit-btn').innerText = 'Add Subject';  // Reset button text
    }

    // Reset form fields
    document.getElementById('subject-form').reset();

    // Show updated timetable for the current day
    showDay(day);
}


// Edit a specific subject
function editSubject(day, index) {
    const entry = timetable[day][index];
    
    document.getElementById('day').value = day;
    document.getElementById('time').value = entry.time;
    document.getElementById('subject').value = entry.subject;
    
    editingIndex = index;  // Set the index of the subject being edited
    document.getElementById('submit-btn').innerText = 'Update Subject';  // Change button text
}

// Delete a specific subject
function deleteSubject(day, index) {
    timetable[day].splice(index, 1);  // Remove the subject at the specified index
    showDay(day);  // Refresh the timetable for the current day
}
