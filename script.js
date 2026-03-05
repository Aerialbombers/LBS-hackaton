// schedule saving/loading and pomodoro timer

// Wait until DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // --- week management --------------------------------------------------
    let currentWeekStart = getMonday(new Date());
    
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function getISOWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    function formatWeek(date) {
        const week = getISOWeekNumber(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 4);
        const monthNames = ['jan', 'feb', 'mars', 'april', 'maj', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dec'];
        const startMonth = monthNames[date.getMonth()];
        const endMonth = monthNames[endDate.getMonth()];
        const year = date.getFullYear();
        return `Vecka ${week}, ${startMonth}. - ${endMonth} ${year}`;
    }

    function updateWeekDisplay() {
        const weekDisplay = document.getElementById('weekDisplay');
        if (weekDisplay) {
            weekDisplay.textContent = formatWeek(currentWeekStart);
        }
        updateDayHeaders();
    }

    function updateDayHeaders() {
        const dayHeaders = document.querySelectorAll('.day-header');
        const dayNames = ['mån', 'tis', 'ons', 'tors', 'fre', 'lör', 'sön'];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            const dayNum = date.getDate();
            const header = dayHeaders[i];
            if (header) {
                const nameEl = header.querySelector('.day-name');
                const numEl = header.querySelector('.day-num');
                if (nameEl) nameEl.textContent = dayNames[i];
                if (numEl) numEl.textContent = dayNum;
            }
        }
    }

    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updateWeekDisplay();
        });
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updateWeekDisplay();
        });
    }
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            if (sidebar) sidebar.classList.toggle('hidden');
        });
    }

    // --- schedule storage --------------------------------------------------
    const daysContainer = document.getElementById('daysContainer');
    const timeColumn = document.getElementById('timeColumn');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const skipButton = document.getElementById('skipButton');
    const scheduleresetbutton = document.getElementById('scheduleresetbutton');

    // hours for schedule left column
    const times = ['tid','00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','2O:OO', '21:OO', '22:OO', '23:OO'];

    // create per-day tables and time column
    function ensureDayTables() {
        if (!daysContainer || !timeColumn) return;
        if (daysContainer.children.length >  0) return; // already built

        // build time column labels
        times.forEach(t => {
            const div = document.createElement('div');
            div.className = 'time-cell';
            div.textContent = t;
            timeColumn.appendChild(div);
        });

        for (let d = 0; d < 7; d++) {
            const table = document.createElement('table');
            table.className = 'day-table';
            table.setAttribute('data-day', d);
            const tbody = document.createElement('tbody');
            times.forEach(() => {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                const cell = document.createElement('div');
                cell.className = 'day-cell';
                cell.setAttribute('data-subj', '');
                cell.setAttribute('data-color', '#ffffff');
                cell.style.backgroundColor = '#ffffff';
                td.appendChild(cell);
                tr.appendChild(td);
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            daysContainer.appendChild(table);
        }
    }

    // serialization: return array of rows (times) each with 5 day objects
    function serializeTable() {
        const data = [];
        if (!daysContainer) return data;
        ensureDayTables();
        const dayTables = daysContainer.querySelectorAll('.day-table');
        for (let ti = 0; ti < times.length; ti++) {
            const rowVals = [];
            for (let d = 0; d < dayTables.length; d++) {
                const tr = dayTables[d].querySelectorAll('tbody tr')[ti];
                const cell = tr.querySelector('.day-cell');
                rowVals.push({
                    text: cell.getAttribute('data-subj') || '',
                    color: cell.getAttribute('data-color') || '#ffffff'
                });
            }
            data.push(rowVals);
        }
        return data;
    }

    function populateTable(data) {
        if (!daysContainer) return;
        ensureDayTables();
        const dayTables = daysContainer.querySelectorAll('.day-table');
        data.forEach((rowVals, ti) => {
            for (let d = 0; d < dayTables.length; d++) {
                const tr = dayTables[d].querySelectorAll('tbody tr')[ti];
                if (!tr) continue;
                const cell = tr.querySelector('.day-cell');
                const obj = (rowVals && rowVals[d]) || {text:'', color:'#ffffff'};
                cell.setAttribute('data-subj', obj.text || '');
                cell.setAttribute('data-color', obj.color || '#ffffff');
                cell.style.backgroundColor = cell.getAttribute('data-color');
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

    // delegate clicks to day cells
    if (daysContainer) {
        ensureDayTables();
        daysContainer.addEventListener('click', e => {
            const cell = e.target.closest('.day-cell');
            if (cell) showCellModal(cell);
        });
    }

    if (scheduleresetbutton) {
        scheduleresetbutton.addEventListener('click', () => {
            if (confirm('Är du säker på att du vill rensa schemat? Detta kan inte ångras.')) {
                // Clear all cells visually
                const cells = document.querySelectorAll('.day-cell');
                cells.forEach(cell => {
                    cell.setAttribute('data-subj', '');
                    cell.setAttribute('data-color', '#ffffff');
                    cell.style.backgroundColor = '#ffffff';
                });
                // Save empty schedule for 5 days
                const emptyData = times.map(() => [
                    {text:'', color:'#ffffff'},
                    {text:'', color:'#ffffff'},
                    {text:'', color:'#ffffff'},
                    {text:'', color:'#ffffff'},
                    {text:'', color:'#ffffff'}
                ]);
                localStorage.setItem('schedule', JSON.stringify(emptyData));
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
    const modalDelete = document.getElementById('modalDelete');
    const modalnextweek = document.getElementById('modalnextweek');
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
    modalDelete.addEventListener('click', () => {
        if (!currentCell) return;
        currentCell.setAttribute('data-subj', '');
        currentCell.setAttribute('data-color', '#ffffff');
        currentCell.style.backgroundColor = '#ffffff';
        hideCellModal();
    });

    if (modalnextweek) {
        modalnextweek.addEventListener('click', () => {
            if (!currentCell) return;
            const subj = modalSubj.value;
            const color = modalColor.value;
            const dayIndex = parseInt(currentCell.closest('.day-table').getAttribute('data-day'), 10);
            const timeIndex = Array.from(currentCell.parentElement.parentElement.children).indexOf(currentCell.parentElement);
        });
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

    // --- calendar functionality -------------------------------------------
    const scheduleViewBtn = document.getElementById('scheduleViewBtn');
    const calendarViewBtn = document.getElementById('calendarViewBtn');
    const weeklyView = document.getElementById('weeklyView');
    const calendarView = document.getElementById('calendarView');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const calendarBody = document.getElementById('calendarBody');
    const monthYearDisplay = document.getElementById('monthYear');

    let calendarData = JSON.parse(localStorage.getItem('calendarData') || '{}');
    let currentCalendarMonth = new Date().getMonth();
    let currentCalendarYear = new Date().getFullYear();
    let selectedDate = null;

    function getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // --- mini calendar in sidebar ------------------------------------------
    const miniCalendarBody = document.getElementById('miniCalendarBody');
    const miniMonthYear = document.getElementById('miniMonthYear');
    const miniPrevMonth = document.getElementById('miniPrevMonth');
    const miniNextMonth = document.getElementById('miniNextMonth');

    let miniMonth = new Date().getMonth();
    let miniYear = new Date().getFullYear();

    function renderMiniCalendar() {
        const firstDay = new Date(miniYear, miniMonth, - 0);
        const lastDay = new Date(miniYear, miniMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const monthNames = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
        miniMonthYear.textContent = `${monthNames[miniMonth]} ${miniYear}`;
        miniCalendarBody.innerHTML = '';

        let date = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                if ((i === 0 && j < startingDayOfWeek) || date > daysInMonth) {
                    cell.classList.add('other-month');
                } else {
                    const dateObj = new Date(miniYear, miniMonth, date);
                    const today = new Date();
                    if (dateObj.toDateString() === today.toDateString()) {
                        cell.classList.add('today');
                    }
                    cell.textContent = date;
                    cell.addEventListener('click', () => {
                        currentWeekStart = getMonday(dateObj);
                        updateWeekDisplay();
                    });
                    date++;
                }
                row.appendChild(cell);
            }
            miniCalendarBody.appendChild(row);
        }
    }

    if (miniPrevMonth) {
        miniPrevMonth.addEventListener('click', () => {
            miniMonth--;
            if (miniMonth < 0) {
                miniMonth = 11;
                miniYear--;
            }
            renderMiniCalendar();
        });
    }

    if (miniNextMonth) {
        miniNextMonth.addEventListener('click', () => {
            miniMonth++;
            if (miniMonth > 11) {
                miniMonth = 0;
                miniYear++;
            }
            renderMiniCalendar();
        });
    }

    // Chatbot modal open/close
    const aichat = document.getElementById("aichat");
    const chatbotModal = document.getElementById("chatbotModal");
    const chatbotClose = document.getElementById("chatbotClose");

    aichat.addEventListener("click", () => {
    chatbotModal.classList.remove("hidden");
    });

    chatbotClose.addEventListener("click", () => {
    chatbotModal.classList.add("hidden");
    });

    // stäng om man klickar på bakgrunden (utanför rutan)
    chatbotModal.addEventListener("click", (e) => {
      if (e.target === chatbotModal) {
        chatbotModal.classList.add("hidden");
    }
    });

    // Initial render
    renderMiniCalendar();
    updateWeekDisplay();
});