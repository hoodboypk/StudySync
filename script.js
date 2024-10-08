const timetableData = {
    monday: [
        { time: "10:00 AM - 12:00 PM", subject: "Salesforce" },
        { time: "12:00 PM - 2:00 PM", subject: "Programming (DSA)" },
        { time: "2:00 PM - 3:00 PM", subject: "Lunch Break", isBreak: true },
        { time: "3:00 PM - 5:00 PM", subject: "Blender" },
        { time: "5:00 PM - 6:00 PM", subject: "Augmented Reality" }
    ],
    tuesday: [
        { time: "10:00 AM - 12:00 PM", subject: "Salesforce" },
        { time: "12:00 PM - 2:00 PM", subject: "Data Analytics" },
        { time: "2:00 PM - 3:00 PM", subject: "Lunch Break", isBreak: true },
        { time: "3:00 PM - 5:00 PM", subject: "Augmented Reality" },
        { time: "5:00 PM - 6:00 PM", subject: "Programming (DSA)" }
    ],
    wednesday: [
        { time: "10:00 AM - 12:00 PM", subject: "Salesforce" },
        { time: "12:00 PM - 2:00 PM", subject: "Blender" },
        { time: "2:00 PM - 3:00 PM", subject: "Lunch Break", isBreak: true },
        { time: "3:00 PM - 5:00 PM", subject: "Data Analytics" },
        { time: "5:00 PM - 6:00 PM", subject: "Augmented Reality" }
    ],
    thursday: [
        { time: "10:00 AM - 12:00 PM", subject: "Salesforce" },
        { time: "12:00 PM - 2:00 PM", subject: "Programming (DSA)" },
        { time: "2:00 PM - 3:00 PM", subject: "Lunch Break", isBreak: true },
        { time: "3:00 PM - 5:00 PM", subject: "Blender" },
        { time: "5:00 PM - 6:00 PM", subject: "Data Analytics" }
    ],
    friday: [
        { time: "10:00 AM - 12:00 PM", subject: "Salesforce" },
        { time: "12:00 PM - 2:00 PM", subject: "Data Analytics" },
        { time: "2:00 PM - 3:00 PM", subject: "Lunch Break", isBreak: true },
        { time: "3:00 PM - 5:00 PM", subject: "Augmented Reality" },
        { time: "5:00 PM - 6:00 PM", subject: "Blender" }
    ],
    saturday: [
        { time: "10:00 AM - 12:00 PM", subject: "Salesforce" },
        { time: "12:00 PM - 2:00 PM", subject: "Blender" },
        { time: "2:00 PM - 3:00 PM", subject: "Lunch Break", isBreak: true },
        { time: "3:00 PM - 5:00 PM", subject: "Programming (DSA)" },
        { time: "5:00 PM - 6:00 PM", subject: "Augmented Reality" }
    ]
};

function showDay(day) {
    const timetableBody = document.getElementById('timetable-body');
    const dayColumn = document.getElementById('day-column');
    
    // Update the header with the selected day
    dayColumn.innerText = day.charAt(0).toUpperCase() + day.slice(1);

    // Clear current timetable data
    timetableBody.innerHTML = '';

    // Add rows for the selected day
    timetableData[day].forEach(slot => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        const subjectCell = document.createElement('td');

        timeCell.innerText = slot.time;
        subjectCell.innerText = slot.subject;

        if (slot.isBreak) {
            subjectCell.classList.add('break');
        }

        row.appendChild(timeCell);
        row.appendChild(subjectCell);
        timetableBody.appendChild(row);
    });
}

// Initialize with Monday's timetable
window.onload = () => {
    showDay('monday');
};
