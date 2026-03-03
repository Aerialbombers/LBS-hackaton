// schedule saving/loading and pomodoro timer

// Wait until DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // --- schedule storage --------------------------------------------------
    const scheduleTable = document.getElementById('scheduleTable');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const skipButton = document.getElementById('skipButton');
    const scheduleresetbutton = document.getElementById('scheduleresetbutton');

    // hours for schedule left column
    const times = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

    function ensureTimeRows() {
        if (!scheduleTable) return;
        const tbody = scheduleTable.querySelector('tbody');
        if (tbody.children.length > 0) return; // already built
        times.forEach(t => {
            const tr = document.createElement('tr');
            const timeTd = document.createElement('td');
            timeTd.textContent = t;
            tr.appendChild(timeTd);
            for (let i = 0; i < 5; i++) {
                const td = document.createElement('td');
                td.className = 'sched-cell';
                td.setAttribute('data-subj', '');
                td.setAttribute('data-color', '#ffffff');
                td.style.backgroundColor = '#ffffff';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
    }

    // serialization based on data attributes of cells (skip time column)
    function serializeTable() {
        const data = [];
        if (!scheduleTable) return data;
        const rows = scheduleTable.querySelectorAll('tbody tr');
        rows.forEach((row) => {
            const vals = [];
            // skip first cell (time)
            const cells = row.querySelectorAll('td');
            cells.forEach((td, idx) => {
                if (idx === 0) return;
                vals.push({
                    text: td.getAttribute('data-subj') || '',
                    color: td.getAttribute('data-color') || '#ffffff'
                });
            });
            data.push(vals);
        });
        return data;
    }

    // populate table from saved data (array of arrays)
    function populateTable(data) {
        if (!scheduleTable) return;
        ensureTimeRows();
        const tbody = scheduleTable.querySelector('tbody');
        // assume data length matches times length (or fewer)
        data.forEach((rowVals, idx) => {
            const tr = tbody.children[idx];
            if (!tr) return;
            // skip time cell, fill rest
            const cells = tr.querySelectorAll('td');
            for (let j = 1; j < cells.length; j++) {
                const td = cells[j];
                const obj = rowVals[j-1] || {text:'',color:'#ffffff'};
                td.setAttribute('data-subj', obj.text || '');
                td.setAttribute('data-color', obj.color || '#ffffff');
                td.style.backgroundColor = td.getAttribute('data-color');
            }
        });
    }


    // wire up buttons
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const data = serializeTable();
            localStorage.setItem('schedule', JSON.stringify(data));
            alert('Schema sparat!');
        });
    }

    if (loadButton) {
        loadButton.addEventListener('click', () => {
            const stored = JSON.parse(localStorage.getItem('schedule') || '[]');
            populateTable(stored);
        });
    }


    // delegate clicks to cells so modal opens reliably
    if (scheduleTable) {
        // make sure hour rows exist before anything else
        ensureTimeRows();
        scheduleTable.addEventListener('click', e => {
            const td = e.target.closest('.sched-cell');
            if (td) {
                showCellModal(td);
            }
        });
        // ensure initial cell backgrounds reflect stored color
        scheduleTable.querySelectorAll('.sched-cell').forEach(td => {
            td.style.backgroundColor = td.getAttribute('data-color');
        });
    }
    

    if (scheduleresetbutton) {
        scheduleresetbutton.addEventListener('click', () => {
            if (confirm('Är du säker på att du vill rensa schemat? Detta kan inte ångras.')) {
                localStorage.removeItem('schedule');
                const tbody = scheduleTable.querySelector('tbody');
                tbody.innerHTML = '';
            }
        });
    }
    

    // show whatever is already stored when page loads
    const initialData = JSON.parse(localStorage.getItem('schedule') || '[]');
    if (initialData.length) {
        populateTable(initialData);
    }

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

    // cell editor modal elements
    const cellModal = document.getElementById('cellModal');
    const modalSubj = document.getElementById('modalSubj');
    const modalColor = document.getElementById('modalColor');
    const modalSave = document.getElementById('modalSave');
    const modalCancel = document.getElementById('modalCancel');
    let currentCell = null;

    // preset palette for quick color selection
    const palette = document.getElementById('colorPalette');
    if (palette) {
        palette.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.classList.contains('palette-color')) {
                modalColor.value = target.getAttribute('data-color');
            }
        });
    }

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

    // --- cell editor pop-up ------------------------------------------------
    function showCellModal(td) {
        if (!td) return;
        currentCell = td;
        const subj = td.getAttribute('data-subj') || '';
        const color = td.getAttribute('data-color') || '#ffffff';
        modalSubj.value = subj;
        modalColor.value = color;
        td.style.backgroundColor = color;
        cellModal.classList.remove('hidden');
    }

    function hideCellModal() {
        cellModal.classList.add('hidden');
        currentCell = null;
    }

    modalSave.addEventListener('click', () => {
        if (!currentCell) return;
        const newSubj = modalSubj.value;
        const newColor = modalColor.value;
        currentCell.setAttribute('data-subj', newSubj);
        currentCell.setAttribute('data-color', newColor);
        currentCell.style.backgroundColor = newColor;
        hideCellModal();
    });

    modalCancel.addEventListener('click', hideCellModal);
    cellModal.addEventListener('click', (e) => {
        if (e.target === cellModal) hideCellModal();
    });


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
