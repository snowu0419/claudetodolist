// 個人化設定：留空（null 或空字串）時使用預設值
const CONFIG = {
  toolName: null,
  intro: null,
  categories: null, // 例：["工作", "生活", "學習"]
  sampleTasks: null, // null＝預設 9 筆；陣列＝自訂；"無"＝空清單
  columnNames: [null, null, null], // 只影響畫面上的欄名
  priorityNames: [null, null, null], // 高、中、低的顯示名稱
  defaultPriority: null, // high／medium／low 或對應顯示名稱
};

const DEFAULTS = {
  toolName: "我的待辦清單",
  intro: "把工作與生活的大小事記下來，一件一件完成。",
  categories: ["工作", "生活"],
  columnNames: ["To-do", "process", "done"],
  priorityNames: ["高", "中", "低"],
  defaultPriority: "medium",
};

// 優先程度識別固定，排序依此順序（與顯示名稱分開）
const PRIORITIES = ["high", "medium", "low"];

// 預設 9 筆示範任務的優先程度（依固定 ID）
const DEFAULT_DEMO_PRIORITY = {
  "demo-01": "low", "demo-02": "high", "demo-03": "medium",
  "demo-04": "low", "demo-05": "high", "demo-06": "medium",
  "demo-07": "low", "demo-08": "high", "demo-09": "medium",
};

// 自訂示範任務在各欄內循環配置的順序
const DEMO_PRIORITY_CYCLE = ["low", "high", "medium"];

// 進度識別固定：尚未開始、進行中、已完成（與畫面欄名分開）
const STATUSES = ["todo", "doing", "done"];

// 預設 9 筆示範任務的初始進度
const DEFAULT_DEMO_STATUS = {
  "demo-01": "todo", "demo-02": "todo", "demo-03": "todo",
  "demo-04": "doing", "demo-05": "doing", "demo-06": "doing",
  "demo-07": "done", "demo-08": "done", "demo-09": "done",
};

// 預設示範任務：ID 與建立時間固定，依此順序排列
const DEFAULT_DEMO_TASKS = [
  { id: "demo-01", name: "整理本週會議紀錄", category: "工作", createdAt: "2026-10-01T09:00:00+08:00" },
  { id: "demo-02", name: "完成專案簡報初稿", category: "工作", createdAt: "2026-10-01T09:01:00+08:00" },
  { id: "demo-03", name: "採買晚餐食材", category: "生活", createdAt: "2026-10-01T09:02:00+08:00" },
  { id: "demo-04", name: "閱讀一本書的第一章", category: "生活", createdAt: "2026-10-01T09:03:00+08:00" },
  { id: "demo-05", name: "回覆客戶確認信", category: "工作", createdAt: "2026-10-01T09:04:00+08:00" },
  { id: "demo-06", name: "整理電腦桌面檔案", category: "工作", createdAt: "2026-10-01T09:05:00+08:00" },
  { id: "demo-07", name: "預約機車保養", category: "生活", createdAt: "2026-10-01T09:06:00+08:00" },
  { id: "demo-08", name: "提交本月費用報帳", category: "工作", createdAt: "2026-10-01T09:07:00+08:00" },
  { id: "demo-09", name: "完成今天的運動", category: "生活", createdAt: "2026-10-01T09:08:00+08:00" },
];

const DEMO_BASE_TIME = Date.parse("2026-10-01T09:00:00+08:00");

function isBlank(value) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function resolveText(value, fallback) {
  return isBlank(value) ? fallback : value.trim();
}

function resolveCategories(value) {
  if (!Array.isArray(value)) return DEFAULTS.categories.slice();
  const cleaned = [...new Set(value.map((c) => String(c).trim()).filter(Boolean))];
  return cleaned.length > 0 ? cleaned : DEFAULTS.categories.slice();
}

// 依設定產生初始任務；只在初始化時呼叫一次
function buildInitialTasks(sampleSetting, categories) {
  if (typeof sampleSetting === "string" && sampleSetting.trim() === "無") return [];

  if (Array.isArray(sampleSetting) && sampleSetting.length > 0) {
    return sampleSetting
      .map((item) => (typeof item === "string" ? { name: item } : item || {}))
      .filter((item) => !isBlank(item.name))
      .map((item, index) => ({
        id: `demo-${String(index + 1).padStart(2, "0")}`,
        name: item.name.trim(),
        category: categories.includes(item.category) ? item.category : categories[0],
        createdAt: new Date(DEMO_BASE_TIME + index * 60000).toISOString(),
        isDemo: true,
      }));
  }

  return DEFAULT_DEMO_TASKS.map((task) => ({ ...task, isDemo: true }));
}

function resolveColumnNames(value) {
  return STATUSES.map((_, i) => resolveText(Array.isArray(value) ? value[i] : null, DEFAULTS.columnNames[i]));
}

function isValidStatus(status) {
  return STATUSES.includes(status);
}

// 只在初始化時呼叫：已有有效進度的任務保留，缺進度的才套用示範分布
function assignInitialStatus(tasks) {
  const total = tasks.length;
  return tasks.map((task, index) => {
    if (isValidStatus(task.status)) return task;
    const status = DEFAULT_DEMO_STATUS[task.id] && CONFIG.sampleTasks == null
      ? DEFAULT_DEMO_STATUS[task.id]
      : STATUSES[Math.floor((index * STATUSES.length) / total)];
    return { ...task, status };
  });
}

function resolvePriorityNames(value) {
  return PRIORITIES.map((_, i) => resolveText(Array.isArray(value) ? value[i] : null, DEFAULTS.priorityNames[i]));
}

function isValidPriority(priority) {
  return PRIORITIES.includes(priority);
}

function resolveDefaultPriority(value, names) {
  if (isBlank(value)) return DEFAULTS.defaultPriority;
  const text = String(value).trim();
  const lower = text.toLowerCase();
  if (isValidPriority(lower)) return lower;
  const byName = names.indexOf(text);
  if (byName >= 0) return PRIORITIES[byName];
  const builtIn = DEFAULTS.priorityNames.indexOf(text);
  return builtIn >= 0 ? PRIORITIES[builtIn] : DEFAULTS.defaultPriority;
}

// 只在初始化時呼叫：只補缺少的優先程度與序號，不動進度
function assignInitialPriority(tasks) {
  const groupIndex = {};
  return tasks.map((task, index) => {
    const seq = Number.isInteger(task.seq) ? task.seq : index;
    if (isValidPriority(task.priority)) return { ...task, seq };
    let priority = "medium";
    if (task.isDemo) {
      if (CONFIG.sampleTasks == null && DEFAULT_DEMO_PRIORITY[task.id]) {
        priority = DEFAULT_DEMO_PRIORITY[task.id];
      } else {
        const n = groupIndex[task.status] || 0;
        groupIndex[task.status] = n + 1;
        priority = DEMO_PRIORITY_CYCLE[n % DEMO_PRIORITY_CYCLE.length];
      }
    }
    return { ...task, priority, seq };
  });
}

function compareTasks(a, b) {
  return (
    PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
    Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
    a.seq - b.seq
  );
}

function priorityName(priority) {
  return state.priorityNames[PRIORITIES.indexOf(priority)];
}

let idCounter = 0;
function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  idCounter += 1;
  return `task-${Date.now()}-${idCounter}`;
}

// 記憶體中的暫存資料：重新整理後回到初始示範分布
const state = {
  tasks: [],
  categories: [],
  columnNames: [],
  priorityNames: [],
  defaultPriority: "medium",
  nextSeq: 0,
  draggingId: null,
  editingId: null,
  litTimers: {},
};

const els = {
  title: document.getElementById("app-title"),
  intro: document.getElementById("app-intro"),
  form: document.getElementById("task-form"),
  name: document.getElementById("task-name"),
  category: document.getElementById("task-category"),
  priority: document.getElementById("task-priority"),
  message: document.getElementById("form-message"),
  count: document.getElementById("task-count"),
  demoNotice: document.getElementById("demo-notice"),
  announcer: document.getElementById("announcer"),
  columns: [...document.querySelectorAll(".column")],
  dialog: document.getElementById("task-dialog"),
  dialogForm: document.getElementById("dialog-form"),
  dialogTitle: document.getElementById("dialog-title"),
  dialogCategory: document.getElementById("dialog-category"),
  dialogPriority: document.getElementById("dialog-priority"),
  dialogStatus: document.getElementById("dialog-status"),
};

function renderCategoryOptions() {
  els.category.replaceChildren(
    ...state.categories.map((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      return option;
    })
  );
  els.category.value = state.categories[0];
}

function renderPriorityOptions() {
  els.priority.replaceChildren(
    ...PRIORITIES.map((priority) => {
      const option = document.createElement("option");
      option.value = priority;
      option.textContent = priorityName(priority);
      return option;
    })
  );
  els.priority.value = state.defaultPriority;
}


function createCard(task, highlightId) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;
  li.dataset.category = task.category;
  li.dataset.priority = task.priority;
  li.draggable = true;
  if (task.id === highlightId) li.classList.add("is-new");

  const top = document.createElement("div");
  top.className = "task-top";

  // 點任務名稱開啟編輯選單
  const name = document.createElement("button");
  name.type = "button";
  name.className = "task-name task-open";
  name.textContent = task.name;
  name.setAttribute("aria-label", `編輯「${task.name}」的分類、優先與進度`);
  name.addEventListener("click", () => openTaskDialog(task.id));

  const tag = document.createElement("button");
  tag.type = "button";
  tag.className = "tag";
  tag.textContent = task.category; // 看板只顯示分類，優先程度以填色表示
  tag.title = `優先程度：${priorityName(task.priority)}（點擊切換）`;
  tag.setAttribute("aria-label", `「${task.name}」優先程度：${priorityName(task.priority)}，點擊切換`);
  tag.addEventListener("click", () => cyclePriority(task.id));

  top.append(name, tag);
  li.append(top);
  return li;
}

// 只讀取 state.tasks，不修改資料
function renderTasks(highlightId) {
  const sorted = state.tasks.slice().sort(compareTasks);

  els.columns.forEach((column) => {
    const status = column.dataset.status;
    const tasks = sorted.filter((task) => task.status === status);
    column.querySelector(".task-list").replaceChildren(...tasks.map((task) => createCard(task, highlightId)));
    column.querySelector(".column-count").textContent = String(tasks.length);
    column.querySelector(".empty-state").hidden = tasks.length > 0;
  });

  els.count.textContent = String(sorted.length);
  els.demoNotice.hidden = !sorted.some((task) => task.isDemo);
}

// 拖曳與進度選單共用：只改進度，其餘欄位不動
// 欄位框線依紅綠燈色亮 3 秒（新增或移入卡片時）
function lightColumn(status) {
  const column = els.columns.find((c) => c.dataset.status === status);
  if (!column) return;
  clearTimeout(state.litTimers[status]);
  column.classList.add("is-lit");
  state.litTimers[status] = setTimeout(() => column.classList.remove("is-lit"), 3000);
}

function focusCard(id, selector) {
  const el = document.querySelector(`.task-item[data-id="${CSS.escape(id)}"] ${selector}`);
  if (el) el.focus();
}

// 拖曳、編輯選單、標籤切換共用：只改指定欄位，名稱與建立時間不動
function updateTask(id, changes) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return null;
  const next = {};
  if (state.categories.includes(changes.category) && changes.category !== task.category) next.category = changes.category;
  if (isValidPriority(changes.priority) && changes.priority !== task.priority) next.priority = changes.priority;
  if (isValidStatus(changes.status) && changes.status !== task.status) next.status = changes.status;
  if (Object.keys(next).length === 0) return null;

  Object.assign(task, next);
  renderTasks();
  if (next.status) lightColumn(next.status);
  return { task, next };
}

function moveTask(id, status) {
  const result = updateTask(id, { status });
  if (!result) return;
  els.announcer.textContent = `「${result.task.name}」已移到 ${state.columnNames[STATUSES.indexOf(status)]}`;
  focusCard(id, ".task-open");
}

function fillSelect(select, values, labels) {
  select.replaceChildren(
    ...values.map((value, i) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = labels[i];
      return option;
    })
  );
}

function openTaskDialog(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  state.editingId = id;
  els.dialogTitle.textContent = task.name;
  fillSelect(els.dialogCategory, state.categories, state.categories);
  fillSelect(els.dialogPriority, PRIORITIES, state.priorityNames);
  fillSelect(els.dialogStatus, STATUSES, state.columnNames);
  els.dialogCategory.value = task.category;
  els.dialogPriority.value = task.priority;
  els.dialogStatus.value = task.status;
  els.dialog.showModal();
}

function setupTaskDialog() {
  els.dialog.addEventListener("close", () => {
    const id = state.editingId;
    state.editingId = null;
    if (!id) return;
    if (els.dialog.returnValue === "confirm") {
      const result = updateTask(id, {
        category: els.dialogCategory.value,
        priority: els.dialogPriority.value,
        status: els.dialogStatus.value,
      });
      if (result) els.announcer.textContent = `已更新「${result.task.name}」`;
    }
    els.dialog.returnValue = "";
    focusCard(id, ".task-open");
  });

  // 點選單外的背景等同取消
  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog) els.dialog.close("cancel");
  });
}

// 點分類標籤切換優先程度：高 → 中 → 低 → 高，只改優先程度
function cyclePriority(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  const priority = PRIORITIES[(PRIORITIES.indexOf(task.priority) + 1) % PRIORITIES.length];
  updateTask(id, { priority });
  els.announcer.textContent = `「${task.name}」優先程度改為${priorityName(priority)}`;
  focusCard(id, ".tag");
}

function clearDragCues() {
  document.querySelectorAll(".is-dragging").forEach((el) => el.classList.remove("is-dragging"));
  els.columns.forEach((column) => column.classList.remove("is-drop-target", "is-drop-over"));
  state.draggingId = null;
}

function setupDragAndDrop() {
  document.addEventListener("dragstart", (event) => {
    const card = event.target.closest && event.target.closest(".task-item");
    if (!card) return;
    state.draggingId = card.dataset.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.id);
    card.classList.add("is-dragging");
    const source = card.closest(".column");
    els.columns.forEach((column) => {
      if (column !== source) column.classList.add("is-drop-target");
    });
  });

  // 拖曳結束（含放下、取消、放到無效區域）一律清除提示
  document.addEventListener("dragend", clearDragCues);

  els.columns.forEach((column) => {
    column.addEventListener("dragover", (event) => {
      if (!state.draggingId || !column.classList.contains("is-drop-target")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      column.classList.add("is-drop-over");
    });

    column.addEventListener("dragleave", (event) => {
      if (!column.contains(event.relatedTarget)) column.classList.remove("is-drop-over");
    });

    column.addEventListener("drop", (event) => {
      if (!state.draggingId || !column.classList.contains("is-drop-target")) return;
      event.preventDefault();
      const id = state.draggingId;
      clearDragCues();
      moveTask(id, column.dataset.status);
    });
  });
}

function showError(text) {
  els.message.textContent = `⚠ ${text}`;
  els.name.setAttribute("aria-invalid", "true");
}

function clearMessage() {
  els.message.textContent = "";
  els.name.removeAttribute("aria-invalid");
}

function addTask() {
  const name = els.name.value.trim();
  if (name === "") {
    showError("請輸入任務名稱，不能只有空白。");
    els.name.value = "";
    els.name.focus();
    return;
  }

  const task = {
    id: createId(),
    name,
    category: els.category.value,
    createdAt: new Date().toISOString(),
    status: "todo",
    priority: isValidPriority(els.priority.value) ? els.priority.value : state.defaultPriority,
    seq: state.nextSeq++,
    isDemo: false,
  };
  state.tasks.push(task);
  renderTasks(task.id);
  lightColumn(task.status);

  els.name.value = "";
  els.priority.value = state.defaultPriority;
  clearMessage();
  els.name.focus();
}

function init() {
  const toolName = resolveText(CONFIG.toolName, DEFAULTS.toolName);
  els.title.textContent = toolName;
  document.title = toolName;
  els.intro.textContent = resolveText(CONFIG.intro, DEFAULTS.intro);

  state.categories = resolveCategories(CONFIG.categories);
  state.columnNames = resolveColumnNames(CONFIG.columnNames);
  state.priorityNames = resolvePriorityNames(CONFIG.priorityNames);
  state.defaultPriority = resolveDefaultPriority(CONFIG.defaultPriority, state.priorityNames);
  state.tasks = assignInitialPriority(
    assignInitialStatus(buildInitialTasks(CONFIG.sampleTasks, state.categories))
  );
  state.nextSeq = state.tasks.reduce((max, t) => Math.max(max, t.seq + 1), 0);

  els.columns.forEach((column) => {
    column.querySelector(".column-name").textContent = state.columnNames[STATUSES.indexOf(column.dataset.status)];
  });

  renderCategoryOptions();
  renderPriorityOptions();
  renderTasks();
  setupDragAndDrop();
  setupTaskDialog();

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask();
  });

  // 中文輸入法選字時按 Enter 不送出
  els.name.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.isComposing || event.keyCode === 229)) {
      event.preventDefault();
    }
  });

  els.name.addEventListener("input", () => {
    if (els.message.textContent) clearMessage();
  });
}

init();
