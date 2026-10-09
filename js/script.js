/* Life Dashboard — Vanilla JavaScript, no framework. */
"use strict";

const STORAGE_KEYS = {
  tasks: "lifeboard_tasks_v1",
  links: "lifeboard_links_v1",
  name: "lifeboard_name_v1",
  theme: "lifeboard_theme_v1"
};

const $ = (selector) => document.querySelector(selector);
const taskForm = $("#taskForm");
const taskInput = $("#taskInput");
const taskList = $("#taskList");
const emptyState = $("#emptyState");
const taskMessage = $("#taskMessage");
const taskCount = $("#taskCount");
const progressBar = $("#progressBar");
const progressText = $("#progressText");
const linkForm = $("#linkForm");
const linkName = $("#linkName");
const linkUrl = $("#linkUrl");
const linkMessage = $("#linkMessage");
const quickLinks = $("#quickLinks");

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn(`Tidak dapat membaca LocalStorage (${key}).`, error);
    return fallback;
  }
}
function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Tidak dapat menyimpan LocalStorage (${key}).`, error);
    return false;
  }
}

let tasks = loadStorage(STORAGE_KEYS.tasks, []);
let links = loadStorage(STORAGE_KEYS.links, [
  { id: "default-google", name: "Google", url: "https://www.google.com/" },
  { id: "default-youtube", name: "YouTube", url: "https://www.youtube.com/" },
  { id: "default-github", name: "GitHub", url: "https://github.com/" },
  { id: "default-gmail", name: "Gmail", url: "https://mail.google.com/" }
]);
if (!Array.isArray(tasks)) tasks = [];
if (!Array.isArray(links)) links = [];
let displayName = loadStorage(STORAGE_KEYS.name, "Teman");
let currentTheme = loadStorage(STORAGE_KEYS.theme, "light");

/* Greeting and live clock */
function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Selamat malam";
  if (hour >= 4 && hour < 11) greeting = "Selamat pagi";
  else if (hour >= 11 && hour < 15) greeting = "Selamat siang";
  else if (hour >= 15 && hour < 18) greeting = "Selamat sore";

  $("#greetingText").textContent = greeting;
  $("#displayName").textContent = displayName;
  $("#profileName").textContent = displayName;
  $("#clockText").textContent = now.toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  const dateOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  const date = now.toLocaleDateString("id-ID", dateOptions);
  $("#clockDate").textContent = date;
  $("#dateText").textContent = date.toLocaleUpperCase("id-ID");
}
updateClock();
setInterval(updateClock, 1000);

$("#editName").addEventListener("click", () => {
  const input = window.prompt("Nama apa yang ingin ditampilkan di dashboard?", displayName);
  if (input === null) return;
  const cleanName = input.trim().slice(0, 35);
  if (!cleanName) {
    displayName = "Teman";
  } else {
    displayName = cleanName;
  }
  saveStorage(STORAGE_KEYS.name, displayName);
  updateClock();
});

/* Light / dark mode */
function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = currentTheme;
  $("#themeToggle").textContent = currentTheme === "dark" ? "☀" : "☾";
  $("#themeToggle").setAttribute("aria-label", currentTheme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap");
  saveStorage(STORAGE_KEYS.theme, currentTheme);
}
applyTheme(currentTheme);
$("#themeToggle").addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

/* To-do list */
function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}
function renderTasks() {
  taskList.replaceChildren();
  const completed = tasks.filter((task) => task.done).length;
  taskCount.textContent = `${tasks.length} tugas`;
  emptyState.hidden = tasks.length > 0;
  taskList.hidden = tasks.length === 0;

  if (tasks.length === 0) {
    progressBar.style.width = "0%";
    progressText.textContent = "Belum ada tugas hari ini";
  } else {
    const percentage = Math.round((completed / tasks.length) * 100);
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${completed} dari ${tasks.length} tugas selesai · ${percentage}%`;
  }

  tasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = `task-item${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = Boolean(task.done);
    checkbox.setAttribute("aria-label", `Tandai ${task.title} selesai`);
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveStorage(STORAGE_KEYS.tasks, tasks);
      renderTasks();
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "small-action";
    editButton.textContent = "✎";
    editButton.title = "Edit tugas";
    editButton.setAttribute("aria-label", `Edit tugas ${task.title}`);
    editButton.addEventListener("click", () => {
      const updated = window.prompt("Ubah nama tugas:", task.title);
      if (updated === null) return;
      const cleanTitle = updated.trim();
      if (!cleanTitle) {
        showMessage(taskMessage, "Nama tugas tidak boleh kosong.", true);
        return;
      }
      if (tasks.some((other) => other.id !== task.id && other.title.toLocaleLowerCase() === cleanTitle.toLocaleLowerCase())) {
        showMessage(taskMessage, "Tugas tersebut sudah ada. Gunakan nama lain.", true);
        return;
      }
      task.title = cleanTitle.slice(0, 180);
      saveStorage(STORAGE_KEYS.tasks, tasks);
      showMessage(taskMessage, "Tugas berhasil diperbarui.");
      renderTasks();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "small-action";
    deleteButton.textContent = "×";
    deleteButton.title = "Hapus tugas";
    deleteButton.setAttribute("aria-label", `Hapus tugas ${task.title}`);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((other) => other.id !== task.id);
      saveStorage(STORAGE_KEYS.tasks, tasks);
      showMessage(taskMessage, "Tugas dihapus.");
      renderTasks();
    });

    actions.append(editButton, deleteButton);
    row.append(checkbox, title, actions);
    taskList.append(row);
  });
}
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    showMessage(taskMessage, "Masukkan nama tugas terlebih dahulu.", true);
    return;
  }
  // Challenge: prevent duplicate tasks (case-insensitive).
  if (tasks.some((task) => task.title.toLocaleLowerCase() === title.toLocaleLowerCase())) {
    showMessage(taskMessage, "Tugas tersebut sudah ada. Tidak ada duplikat yang ditambahkan.", true);
    return;
  }
  tasks.unshift({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: title.slice(0, 180), done: false });
  saveStorage(STORAGE_KEYS.tasks, tasks);
  taskInput.value = "";
  showMessage(taskMessage, "Tugas berhasil ditambahkan.");
  renderTasks();
  taskInput.focus();
});
renderTasks();

/* Quick links */
function normalizeUrl(value) {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}
function renderLinks() {
  quickLinks.replaceChildren();
  if (links.length === 0) {
    const note = document.createElement("p");
    note.className = "panel-description";
    note.textContent = "Belum ada tautan. Tambahkan situs favoritmu di atas.";
    quickLinks.append(note);
    return;
  }

  links.forEach((link) => {
    const card = document.createElement("div");
    card.className = "quick-link";

    const icon = document.createElement("span");
    icon.className = "link-favicon";
    icon.textContent = (link.name || "?").trim().charAt(0).toUpperCase();

    const copy = document.createElement("a");
    copy.className = "link-copy";
    copy.href = link.url;
    copy.target = "_blank";
    copy.rel = "noopener noreferrer";
    copy.title = `Buka ${link.name}`;
    const strong = document.createElement("strong");
    strong.textContent = link.name;
    const small = document.createElement("span");
    try { small.textContent = new URL(link.url).hostname.replace(/^www\./, ""); }
    catch { small.textContent = link.url; }
    copy.append(strong, small);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-link";
    remove.textContent = "×";
    remove.title = `Hapus ${link.name}`;
    remove.setAttribute("aria-label", `Hapus tautan ${link.name}`);
    remove.addEventListener("click", () => {
      links = links.filter((item) => item.id !== link.id);
      saveStorage(STORAGE_KEYS.links, links);
      renderLinks();
      showMessage(linkMessage, "Tautan dihapus.");
    });

    card.append(icon, copy, remove);
    quickLinks.append(card);
  });
}
linkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = linkName.value.trim();
  const url = normalizeUrl(linkUrl.value);
  if (!name) {
    showMessage(linkMessage, "Masukkan nama situs.", true);
    return;
  }
  if (!url) {
    showMessage(linkMessage, "Masukkan URL valid yang diawali http:// atau https://.", true);
    return;
  }
  if (links.some((link) => link.url.toLowerCase() === url.toLowerCase())) {
    showMessage(linkMessage, "Tautan tersebut sudah ada.", true);
    return;
  }
  links.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: name.slice(0, 35), url });
  saveStorage(STORAGE_KEYS.links, links);
  linkForm.reset();
  showMessage(linkMessage, "Quick link berhasil ditambahkan.");
  renderLinks();
});
renderLinks();

/* Focus timer — default 25 minutes. */
const DEFAULT_TIMER_SECONDS = 25 * 60;
const CIRCUMFERENCE = 2 * Math.PI * 94;
let remainingSeconds = DEFAULT_TIMER_SECONDS;
let timerInterval = null;
let timerRunning = false;

function renderTimer() {
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
  $("#timerText").textContent = `${minutes}:${seconds}`;
  const progress = 1 - (remainingSeconds / DEFAULT_TIMER_SECONDS);
  $("#timerProgress").style.strokeDasharray = `${CIRCUMFERENCE}`;
  $("#timerProgress").style.strokeDashoffset = `${CIRCUMFERENCE * progress}`;
  $("#timerHint").textContent = timerRunning ? "Kamu sedang fokus. Semangat!" : "Siap untuk mulai?";
}
function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerRunning = false;
  renderTimer();
}
$("#startTimer").addEventListener("click", () => {
  if (timerRunning) return;
  if (remainingSeconds <= 0) remainingSeconds = DEFAULT_TIMER_SECONDS;
  timerRunning = true;
  showMessage($("#timerMessage"), "Sesi fokus sedang berjalan.");
  renderTimer();
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      stopTimer();
      $("#timerMode").textContent = "SESSION DONE";
      $("#timerHint").textContent = "Kerja bagus! Saatnya istirahat.";
      showMessage($("#timerMessage"), "Sesi fokus selesai. Kerja bagus!");
      renderTimer();
      $("#timerMode").textContent = "SESSION DONE";
      $("#timerHint").textContent = "Kerja bagus! Saatnya istirahat.";
      return;
    }
    renderTimer();
  }, 1000);
});
$("#stopTimer").addEventListener("click", () => {
  stopTimer();
  showMessage($("#timerMessage"), "Timer dijeda. Tekan Mulai untuk melanjutkan.");
  $("#timerMode").textContent = "FOCUS TIME";
});
$("#resetTimer").addEventListener("click", () => {
  stopTimer();
  remainingSeconds = DEFAULT_TIMER_SECONDS;
  $("#timerMode").textContent = "FOCUS TIME";
  showMessage($("#timerMessage"), "Timer kembali ke 25 menit.");
  renderTimer();
});
renderTimer();
