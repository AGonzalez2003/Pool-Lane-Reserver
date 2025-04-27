//Stores the state of each lane (occupied, closed, timer info)
let lanes = [];

//Default time limit for a lane in minutes
let timeLimit = 1;

//Array to store waitlist entries
let waitlist = [];

loadFromLocalStorage();
renderLanes();
renderClosedLanes();
applyTimerVisibility();
/* ------------------ PAGE NAVIGATION FUNCTIONS ------------------ */

//Show main page (hides settings)
function showMainPage() {
    document.getElementById("mainPage").style.display = "block";
    document.getElementById("settingsPage").style.display = "none";
}

//Show settings page (hides main)
function showSettingsPage() {
    document.getElementById("mainPage").style.display = "none";
    document.getElementById("settingsPage").style.display = "block";
}

/* ------------------ LANE SETUP AND TIMER LOGIC ------------------ */

//Updates the number of lanes and their initial states
function updateLanes() {
    
    // First stop all existing lane timers
    lanes.forEach(lane => {
        if (lane.interval) {
            clearInterval(lane.interval);
        }
    });
    
    const numOfLanes = parseInt(document.getElementById("numberOfLanes").value) || 1;
    
    //Creates array of lane objects
    lanes = Array.from({ length: numOfLanes }, () => ({
        occupied: false,
        closed: false,
        timer: timeLimit * 60,
        interval: null
    }));

    //Re-renders UI
    renderLanes();

    //Re-apply timer display settings
    applyTimerVisibility();

    //Update closed lanes buttons
    renderClosedLanes();
}

//Updates the time limit and resets unoccupied lanes
function confirmTimeLimit() {
    const inputTime = parseInt(document.getElementById("timeLimit").value);
    if (inputTime > 0) {
        timeLimit = inputTime;

        //Update timer for unoccupied lanes
        lanes.forEach(lane => {
            if (!lane.occupied) {
                lane.timer = timeLimit * 60;
            }
        });

        renderLanes();
        applyTimerVisibility();
        alert(`Time limit set to ${timeLimit} minutes.`);
    } else {
        alert("Please enter a valid time limit.");
    }
}

//Displays each lane as a button with timer
function renderLanes() {
    const container = document.getElementById("lanesContainer");
    container.innerHTML = "";

    lanes.forEach((lane, index) => {
        const laneDiv = document.createElement("div");
        laneDiv.className = `lane ${lane.occupied ? "occupied" : ""} ${lane.closed ? "closed" : ""}`;
        laneDiv.textContent = `Lane ${index + 1}`;
        laneDiv.onclick = () => toggleLane(index);

        //Timer inside each lane
        const timerSpan = document.createElement("span");
        timerSpan.className = "timer";
        timerSpan.id = `timer-${index}`;
        timerSpan.textContent = formatTime(lane.timer || timeLimit * 60);

        laneDiv.appendChild(timerSpan);
        container.appendChild(laneDiv);
    });
}

//Toggle lane between occupied and available, and start/stop timer
function toggleLane(index) {
    if (lanes[index].closed) return;

    if (!lanes[index].occupied) {
        lanes[index].timer = timeLimit * 60;
        //Starts countdown
        startTimer(index);
    } else {
        //Stops countdown
        stopTimer(index);
        lanes[index].timer = timeLimit * 60;
        document.getElementById(`timer-${index}`).textContent = formatTime(lanes[index].timer);
    }

    lanes[index].occupied = !lanes[index].occupied;
    renderLanes();
    applyTimerVisibility();
    saveToLocalStorage();
}

//Starts countdown timer for a specific lane
function startTimer(index) {
    
    //Stop existing timer if any
    stopTimer(index);

    if (lanes[index].timer === 0) {
        lanes[index].timer = timeLimit * 60;
    }

    lanes[index].interval = setInterval(() => {
        if (lanes[index].timer <= 0) {
            lanes[index].timer = 0;
            document.getElementById(`timer-${index}`).textContent = formatTime(0);
            clearInterval(lanes[index].interval);
            return;
        }
        lanes[index].timer--;
        document.getElementById(`timer-${index}`).textContent = formatTime(lanes[index].timer);
    }, 1000); //Tick every second
}

//Stops the timer for a lane
function stopTimer(index) {
    clearInterval(lanes[index].interval);
    lanes[index].interval = null;
}

//Converts seconds to MM:SS format
function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/* ------------------ CLOSED LANES MANAGEMENT ------------------ */

//Render close/open lane buttons for each lane
function renderClosedLanes() {
    const container = document.getElementById("closedLanesContainer");
    container.innerHTML = "";

    lanes.forEach((_, index) => {
        const btn = document.createElement("button");
        btn.textContent = `Close Lane ${index + 1}`;
        btn.onclick = () => toggleClosedLane(index);
        btn.style.backgroundColor = lanes[index].closed ? "red" : "";
        container.appendChild(btn);
    });
}

//Toggle lane's closed status
function toggleClosedLane(index) {
    lanes[index].closed = !lanes[index].closed;
    renderLanes();
    applyTimerVisibility();
    renderClosedLanes();
    saveToLocalStorage();
}

//Reset all lanes to default (available, timer reset)
function resetTimers() {
    lanes.forEach((lane, index) => {
        stopTimer(index);
        lane.occupied = false;
        lane.timer = timeLimit * 60;
    });

    renderLanes();
    applyTimerVisibility();
    saveToLocalStorage();
}

/* ------------------ TIMER VISIBILITY TOGGLE ------------------ */

//Show or hide all timers depending on toggle switch
function applyTimerVisibility() {
    const hideTimers = document.getElementById("myToggle").checked;
    document.querySelectorAll(".timer").forEach(timer => {
        timer.classList.toggle("hidden", hideTimers);

        // Center lane text if timers are hidden
        const laneDiv = timer.parentElement; 
        if (hideTimers) {
            laneDiv.classList.add("centered");
        } else {
            laneDiv.classList.remove("centered");
        }
    });
}

//Add listener so toggle works in real-time
document.getElementById("myToggle").addEventListener("change", applyTimerVisibility);

/* ------------------ WAITLIST FUNCTIONALITY ------------------ */

//Show waitlist modal
function showWaitlistPage() {
    document.getElementById("waitlistModal").style.display = "flex";
    renderWaitlist();
}

//Hide waitlist modal
function closeWaitlist() {
    document.getElementById("waitlistModal").style.display = "none";
}

//Render waitlist entries and dropdown menu
function renderWaitlist() {
    const container = document.getElementById("waitlistContainer");
    container.innerHTML = "";

    const select = document.getElementById("removeNameSelect");
    select.innerHTML = `<option value="">-- Remove Someone --</option>`;

    waitlist.forEach((entry, index) => {
        const li = document.createElement("li");
        li.innerHTML = `${entry.name} ${entry.note ? "<small>(" + entry.note + ")</small>" : ""}`;
        container.appendChild(li);

        const option = document.createElement("option");
        option.value = entry.name;
        option.text = `${index + 1}. ${entry.name}`;
        select.appendChild(option);
    });
}

//Add a person to the waitlist
function addToWaitlist() {
    const nameInput = document.getElementById("waitlistName");
    const noteInput = document.getElementById("waitlistNote");
    const name = nameInput.value.trim();
    const note = noteInput.value.trim();

    if (name) {
        waitlist.push({ name, note });
        nameInput.value = "";
        noteInput.value = "";
        renderWaitlist();
        saveToLocalStorage();
    }
}

//Remove the first person from the waitlist (FIFO)
function serveNext() {
    if (waitlist.length > 0) {
       
        // remove first
        const served = waitlist.shift(); 
        renderWaitlist();
        saveToLocalStorage();
    }
}

//Remove a specific person by name
function removeByName() {
    const selectedName = document.getElementById("removeNameSelect").value;
    waitlist = waitlist.filter(entry => entry.name !== selectedName);
    renderWaitlist();
    saveToLocalStorage();
}

/* ------------------ LOCAL STORAGE ------------------ */

// Save lanes and waitlist to localStorage
function saveToLocalStorage() {
    localStorage.setItem('lanes', JSON.stringify(lanes));
    localStorage.setItem('waitlist', JSON.stringify(waitlist));
    localStorage.setItem('timeLimit', timeLimit);
}

// Load lanes and waitlist from localStorage
function loadFromLocalStorage() {
    const savedLanes = JSON.parse(localStorage.getItem('lanes'));
    const savedWaitlist = JSON.parse(localStorage.getItem('waitlist'));
    const savedTimeLimit = parseInt(localStorage.getItem('timeLimit'));

    if (savedLanes) {
        lanes = savedLanes.map(lane => ({
            ...lane,
            //Resets timers because intervals cant be saved
            interval: null
        }));
    }
    if (savedWaitlist) {
        waitlist = savedWaitlist;
    }
    if (savedTimeLimit) {
        timeLimit = savedTimeLimit;
    }
}