// schedule saving/loading and pomodoro timer

// Wait until DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // --- schedule storage --------------------------------------------------
    const inputDiv = document.querySelector('.input-text');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const skipButton = document.getElementById('skipButton');

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            localStorage.setItem('schedule', inputDiv.innerText);
            alert('Schema sparat!');
        });
    }

    if (loadButton) {
        loadButton.addEventListener('click', () => {
            const stored = localStorage.getItem('schedule');
            if (stored !== null) {
                inputDiv.innerText = stored;
            }
        });
    }

    // --- pomodoro timer -----------------------------------------------------
    const timerDisplay = document.getElementById('timer');
    const startPauseBtn = document.getElementById('startPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const workInput = document.getElementById('workDuration');
    const breakInput = document.getElementById('breakDuration');

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
});
