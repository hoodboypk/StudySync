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

// Populate hour and minute options dynamically
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
    showDay(day);  // Refresh timetable display
}

// Populate time dropdowns on page load
populateTimeDropdowns();
showDay('monday');  // Show Monday timetable by default
