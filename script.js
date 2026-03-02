// schedule saving/loading and pomodoro timer

// Wait until DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // --- schedule storage --------------------------------------------------
    // elements for schedule table
    const scheduleTable = document.getElementById('scheduleTable');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const addRowButton = document.getElementById('addRowButton');
    const scheduleDisplay = document.getElementById('scheduleDisplay');
    const skipButton = document.getElementById('skipButton');

    // convert table into an array-of-rows containing cell values
    function serializeTable() {
        const data = [];
        if (!scheduleTable) return data;
        const rows = scheduleTable.querySelectorAll('tbody tr');
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td input.subj');
            const values = [];
            cells.forEach(cell => values.push(cell.value));
            data.push(values);
        });
        return data;
    }

    // populate table from data array
    function populateTable(data) {
        if (!scheduleTable) return;
        const tbody = scheduleTable.querySelector('tbody');
        tbody.innerHTML = ''; // clear
        data.forEach((rowVals, idx) => {
            const tr = document.createElement('tr');
            const periodCell = document.createElement('td');
            periodCell.textContent = idx + 1;
            tr.appendChild(periodCell);
            rowVals.forEach(val => {
                const td = document.createElement('td');
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.className = 'subj';
                inp.value = val;
                td.appendChild(inp);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    function refreshScheduleDisplay() {
        if (scheduleDisplay) {
            const data = JSON.parse(localStorage.getItem('schedule') || '[]');
            // make a simple text representation
            let text = '';
            data.forEach((row, i) => {
                text += `Period ${i+1}: ` + row.join(' | ') + '\n';
            });
            scheduleDisplay.textContent = text;
        }
    }

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const data = serializeTable();
            localStorage.setItem('schedule', JSON.stringify(data));
            alert('Schema sparat!');
            refreshScheduleDisplay();
        });
    }

    if (loadButton) {
        loadButton.addEventListener('click', () => {
            const stored = JSON.parse(localStorage.getItem('schedule') || '[]');
            populateTable(stored);
            refreshScheduleDisplay();
        });
    }

    if (addRowButton) {
        addRowButton.addEventListener('click', () => {
            if (!scheduleTable) return;
            const tbody = scheduleTable.querySelector('tbody');
            const newRow = document.createElement('tr');
            const periodCell = document.createElement('td');
            periodCell.textContent = tbody.children.length + 1;
            newRow.appendChild(periodCell);
            for (let i = 0; i < 5; i++) {
                const td = document.createElement('td');
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.className = 'subj';
                td.appendChild(inp);
                newRow.appendChild(td);
            }
            tbody.appendChild(newRow);
        });
    }

    // show whatever is already stored when page loads
    const initialData = JSON.parse(localStorage.getItem('schedule') || '[]');
    if (initialData.length) populateTable(initialData);
    refreshScheduleDisplay();

    // --- pomodoro timer -----------------------------------------------------
    const timerDisplay = document.getElementById('timer');
    const startPauseBtn = document.getElementById('startPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const workInput = document.getElementById('workDuration');
    const breakInput = document.getElementById('breakDuration');

    // modal/nav elements
    const pomodoroNavBtn = document.getElementById('pomodoroNavBtn');
    const pomodoroModal = document.getElementById('pomodoroModal');
    const modalClose = document.getElementById('modalClose');

    // durations in seconds - will be updated based on inputs
    let workTime = 25 * 60;   // seconds
    let breakTime = 5 * 60;   // seconds
    let currentTime = workTime;
    let timerInterval = null;
    let isWork = true;
    let running = false;

    function updateDurations() {
        // read minutes from inputs, fallback to defaults if invalid
        const minutesW = parseInt(workInput.value, 10) || 25;
        const minutesB = parseInt(breakInput.value, 10) || 5;
        workTime = minutesW * 60;
        breakTime = minutesB * 60;
        if (!running) {
            currentTime = isWork ? workTime : breakTime;
            updateDisplay();
        }
    }

    // hook up change listeners
    if (workInput) workInput.addEventListener('change', updateDurations);
    if (breakInput) breakInput.addEventListener('change', updateDurations);

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s
            .toString()
            .padStart(2, '0')}`;
    }

    function updateDisplay() {
        if (timerDisplay) timerDisplay.textContent = formatTime(currentTime);
    }

    function switchPeriod() {
        isWork = !isWork;
        currentTime = isWork ? workTime : breakTime;
        updateDisplay();
        updateSkipText();
    }

    function tick() {
        if (currentTime > 0) {
            currentTime--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            running = false;
            if (startPauseBtn) startPauseBtn.textContent = 'Start';

            // notify the user
            if (isWork) {
                alert('Work period ended! Time for a break.');
            } else {
                alert('Break is over! Back to work.');
            }

            switchPeriod();
        }
    }

    if (startPauseBtn) {
        startPauseBtn.addEventListener('click', () => {
            if (running) {
                clearInterval(timerInterval);
                running = false;
                startPauseBtn.textContent = 'Start';
            } else {
                timerInterval = setInterval(tick, 1000);
                running = true;
                startPauseBtn.textContent = 'Pause';
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            running = false;
            isWork = true;
            currentTime = workTime;
            updateDisplay();
            if (startPauseBtn) startPauseBtn.textContent = 'Start';
        });
    }

    // skip current period and start the next one immediately
    if (skipButton) {
        skipButton.addEventListener('click', () => {
            // if timer running, stop it before switching
            if (running) {
                clearInterval(timerInterval);
            }
            // switch periods regardless of work/break
            switchPeriod();
            // restart timer if it was running
            if (running) {
                timerInterval = setInterval(tick, 1000);
            }
            // update button text to reflect new state
            updateSkipText();
        });
    }

    function updateSkipText() {
        if (!skipButton) return;
        // when on a break period, label invites skipping the break
        skipButton.textContent = isWork ? 'Hoppa över arbetsperiod' : 'Hoppa över paus';
    }

    // call on state changes
    updateSkipText();

    // sync initial values
    updateDurations();
    updateDisplay();

    // --- modal behavior ----------------------------------------------------
    function showModal() {
        if (pomodoroModal) pomodoroModal.classList.remove('hidden');
    }
    function hideModal() {
        if (pomodoroModal) pomodoroModal.classList.add('hidden');
    }

    if (pomodoroNavBtn) {
        pomodoroNavBtn.addEventListener('click', () => {
            // toggle visibility
            if (pomodoroModal && pomodoroModal.classList.contains('hidden')) {
                showModal();
            } else {
                hideModal();
            }
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }

    // close when clicking outside content
    if (pomodoroModal) {
        pomodoroModal.addEventListener('click', (e) => {
            if (e.target === pomodoroModal) hideModal();
        });
    }
});
