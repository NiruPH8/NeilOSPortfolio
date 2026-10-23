'use strict';

/* ============================================================================
   PORTFOLIO OS — JAVASCRIPT GUIDE

   Sections:
   1. Elements and shared state
   2. Window management (open / close / minimize)
   3. Draggable desktop windows
   4. Responsive window reset
   5. Start menu and keyboard shortcuts
   6. Taskbar clock
   7. Light / dark theme toggle

   Change the displayed content in index.html.
   Change colors, sizes, and spacing in style.css.
   This file controls the interactions — you usually won't need to edit it.
   ============================================================================ */


// -----------------------------------------------------------------------------
// 1. ELEMENTS AND SHARED STATE
// -----------------------------------------------------------------------------

const windows = [...document.querySelectorAll('.app-window')];
const taskItems = document.getElementById('taskItems');
const startMenu = document.getElementById('startMenu');
const startButton = document.getElementById('startButton');

const compactWindowLayout = window.matchMedia('(max-width: 1150px)');
const opened = new Set();

let topZ = 10;

function getWindow(id) {
  return document.getElementById(`window-${id}`);
}


// -----------------------------------------------------------------------------
// 2. WINDOW MANAGEMENT
// -----------------------------------------------------------------------------

function focusWindow(win) {
  win.style.zIndex = ++topZ;

  document.querySelectorAll('.task-item').forEach(item => {
    item.classList.toggle(
      'active',
      item.dataset.id === win.id.slice(7)
    );
  });
}

function renderTasks() {
  taskItems.replaceChildren();

  opened.forEach(id => {
    const win = getWindow(id);
    const btn = document.createElement('button');

    btn.className = 'task-item' + (
      !win.hidden && Number(win.style.zIndex) === topZ ? ' active' : ''
    );

    btn.dataset.id = id;
    btn.innerHTML = `<span aria-hidden="true">${win.dataset.icon}</span><span class="task-name">${win.dataset.title}</span>`;

    btn.setAttribute(
      'aria-label',
      `${win.hidden ? 'Restore' : 'Show or minimize'} ${win.dataset.title}`
    );

    btn.addEventListener('click', () => {
      if (win.hidden) {
        win.hidden = false;
        focusWindow(win);
      } else if (Number(win.style.zIndex) === topZ) {
        win.hidden = true;
      } else {
        focusWindow(win);
      }

      renderTasks();
    });

    taskItems.append(btn);
  });
}

function openWindow(id) {
  const win = getWindow(id);
  if (!win) return;

  win.hidden = false;
  opened.add(id);
  focusWindow(win);

  startMenu.hidden = true;
  startButton.setAttribute('aria-expanded', 'false');

  renderTasks();
}

function closeWindow(win) {
  win.hidden = true;
  opened.delete(win.id.slice(7));
  renderTasks();
}

function minimizeWindow(win) {
  win.hidden = true;
  renderTasks();
}

// All desktop shortcuts, Start menu shortcuts, and hero buttons use data-open.
document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => openWindow(button.dataset.open));
});


// -----------------------------------------------------------------------------
// 3. DRAGGABLE DESKTOP WINDOWS
// -----------------------------------------------------------------------------

windows.forEach(win => {
  win.querySelector('[data-close]').addEventListener('click', () => {
    closeWindow(win);
  });

  win.querySelector('[data-minimize]').addEventListener('click', () => {
    minimizeWindow(win);
  });

  win.addEventListener('pointerdown', () => {
    focusWindow(win);
    renderTasks();
  });

  const handle = win.querySelector('.window-titlebar');
  let drag = null;

  handle.addEventListener('pointerdown', event => {
    // Dragging is disabled on compact tablet and phone layouts.
    if (
      event.button !== 0 ||
      event.target.closest('button') ||
      compactWindowLayout.matches
    ) {
      return;
    }

    const rect = win.getBoundingClientRect();

    // Window positions are relative to .window-layer, not the page origin.
    const container = win.offsetParent;
    const parentRect = container.getBoundingClientRect();
    const left = rect.left - parentRect.left + container.scrollLeft;
    const top = rect.top - parentRect.top + container.scrollTop;

    // Remove the initial centering transform WITHOUT jumping away from cursor.
    win.style.left = `${left}px`;
    win.style.top = `${top}px`;
    win.style.transform = 'none';
    win.style.animation = 'none';
    win.dataset.dragged = 'true';

    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left,
      top
    };

    handle.setPointerCapture(event.pointerId);
  });

  handle.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const container = win.offsetParent;

    // Keep the full window and its close button inside the usable viewport.
    const windowWidth = win.getBoundingClientRect().width;
    const windowHeight = win.getBoundingClientRect().height;
    const taskbarHeight = document.querySelector('.taskbar').getBoundingClientRect().height;
    const visibleBottom = window.innerHeight - taskbarHeight - 12;

    const maxLeft = Math.max(
      0,
      container.clientWidth - windowWidth - 12
    );

    const maxTop = Math.max(
      0,
      Math.min(
        container.clientHeight - windowHeight - 12,
        visibleBottom - container.getBoundingClientRect().top - windowHeight
      )
    );

    const x = Math.max(
      0,
      Math.min(maxLeft, drag.left + event.clientX - drag.x)
    );

    const y = Math.max(
      0,
      Math.min(maxTop, drag.top + event.clientY - drag.y)
    );

    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  });

  handle.addEventListener('pointerup', () => {
    drag = null;
  });

  handle.addEventListener('pointercancel', () => {
    drag = null;
  });
});


// -----------------------------------------------------------------------------
// 4. RESPONSIVE WINDOW RESET
// -----------------------------------------------------------------------------

// When switching between phone/tablet and desktop screen widths, remove old
// dragged coordinates so windows cannot reappear outside the viewport.
function resetWindowPositions() {
  windows.forEach(win => {
    win.style.removeProperty('left');
    win.style.removeProperty('top');
    win.style.removeProperty('transform');
    win.style.removeProperty('animation');
    delete win.dataset.dragged;
  });
}

compactWindowLayout.addEventListener('change', resetWindowPositions);


// -----------------------------------------------------------------------------
// 5. START MENU AND KEYBOARD SHORTCUTS
// -----------------------------------------------------------------------------

startButton.addEventListener('click', event => {
  event.stopPropagation();

  startMenu.hidden = !startMenu.hidden;
  startButton.setAttribute('aria-expanded', String(!startMenu.hidden));
});

document.addEventListener('pointerdown', event => {
  if (
    !startMenu.hidden &&
    !startMenu.contains(event.target) &&
    !startButton.contains(event.target)
  ) {
    startMenu.hidden = true;
    startButton.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;

  if (!startMenu.hidden) {
    startMenu.hidden = true;
    startButton.setAttribute('aria-expanded', 'false');
  } else {
    const visible = windows
      .filter(win => !win.hidden)
      .sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));

    if (visible[0]) minimizeWindow(visible[0]);
  }
});


// -----------------------------------------------------------------------------
// 6. TASKBAR CLOCK
// -----------------------------------------------------------------------------

function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });

  document.getElementById('topClock').textContent = time;
  document.getElementById('taskClock').textContent = time;

  document.getElementById('taskDate').textContent = now.toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric' }
  );
}

updateClock();
setInterval(updateClock, 30000);


// -----------------------------------------------------------------------------
// 7. LIGHT / DARK THEME TOGGLE
// -----------------------------------------------------------------------------

// Pastel light mode is the default, with the visitor's selection remembered.
const themeToggle = document.getElementById('themeToggle');
const themeGlyph = document.getElementById('themeGlyph');
const themeLabel = document.getElementById('themeLabel');
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeStorageKey = 'portfolio-os-theme';

function readSavedTheme() {
  try {
    return localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Also works in private browsing and restricted local-file environments.
  }
}

function setTheme(theme, remember = true) {
  const dark = theme === 'dark';

  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeGlyph.textContent = dark ? '☀' : '☾';
  themeLabel.textContent = dark ? 'Light mode' : 'Dark mode';

  themeToggle.setAttribute(
    'aria-label',
    dark ? 'Switch to pastel light mode' : 'Switch to dark mode'
  );

  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.title = dark ? 'Switch to pastel theme' : 'Switch to dark theme';

  if (themeColor) {
    themeColor.content = dark ? '#08090c' : '#f8fbfa';
  }

  if (remember) saveTheme(theme);
}

themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

setTheme(readSavedTheme(), false);
