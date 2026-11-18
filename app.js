/* Stillpoint — free focus dashboard + planner. All data stays in localStorage. */
(() => {
  "use strict";

  // ---------- Storage ----------
  const KEY = "stillpoint.v1";
  const defaults = () => ({
    settings: {
      name: "", focus: 25, short: 5, long: 15, interval: 4,
      autoBreak: false, autoFocus: false, chime: true, notify: false,
      clock24: false, quotes: true,
    },
    tasks: [],
    selectedTask: null,
    plans: [],
    goals: {},
    notes: {},
    history: {},
    scene: "dusk",
    customBg: "",
    sounds: {},
  });

  let S;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    S = Object.assign(defaults(), saved || {});
    S.settings = Object.assign(defaults().settings, S.settings || {});
  } catch { S = defaults(); }

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch { toast("Couldn't save — storage is full (try a smaller background image)"); }
  };

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfWeek = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; return addDays(x, -wd); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toMin = (t) => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmtTime = (t) => {
    if (!t) return "";
    if (S.settings.clock24) return t;
    let [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12;
    return `${h}:${pad(m)}${ap}`;
  };
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
  }

  // ---------- Views ----------
  function showView(name) {
    $$(".tab").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    if (name === "planner") renderPlanner();
    if (name === "stats") renderStats();
  }
  $$(".tab").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.goto)));

  // ---------- Clock & greeting ----------
  function tickClock() {
    const now = new Date();
    let h = now.getHours(); const m = now.getMinutes();
    let txt;
    if (S.settings.clock24) txt = `${pad(h)}:${pad(m)}`;
    else txt = `${h % 12 || 12}:${pad(m)}`;
    $("#clock").textContent = txt;
    const part = h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Good night";
    $("#greeting").textContent = S.settings.name ? `${part}, ${S.settings.name}` : part;
    $("#dateLine").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }
  setInterval(tickClock, 1000 * 5);

  // ---------- Quotes ----------
  const QUOTES = [
    ["The secret of getting ahead is getting started.", "Mark Twain"],
    ["It does not matter how slowly you go as long as you do not stop.", "Confucius"],
    ["Concentrate all your thoughts upon the work at hand.", "Alexander Graham Bell"],
    ["You can do anything, but not everything.", "David Allen"],
    ["Action is the foundational key to all success.", "Pablo Picasso"],
    ["Well begun is half done.", "Aristotle"],
    ["What we fear doing most is usually what we most need to do.", "Tim Ferriss"],
    ["Small deeds done are better than great deeds planned.", "Peter Marshall"],
    ["The way to get started is to quit talking and begin doing.", "Walt Disney"],
    ["Focus on being productive instead of busy.", "Tim Ferriss"],
    ["Simplicity boils down to two steps: identify the essential, eliminate the rest.", "Leo Babauta"],
    ["Either you run the day or the day runs you.", "Jim Rohn"],
  ];
  function renderQuote() {
    const q = $("#quote");
    if (!S.settings.quotes) { q.classList.add("hidden"); return; }
    const day = Math.floor(Date.now() / 864e5);
    const [t, a] = QUOTES[day % QUOTES.length];
    q.innerHTML = `“${esc(t)}” — ${esc(a)}`;
    q.classList.remove("hidden");
  }

  // ---------- Backgrounds ----------
  const SCENES = {
    dusk: ["Dusk", "linear-gradient(160deg,#2b1e3f 0%,#6b3f6b 45%,#e08a5f 100%)"],
    ocean: ["Ocean", "linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)"],
    forest: ["Forest", "linear-gradient(160deg,#0b1f17 0%,#1f4d3a 55%,#6b8f5e 100%)"],
    aurora: ["Aurora", "radial-gradient(ellipse at 20% 20%,#3dd6b0 0%,transparent 45%),radial-gradient(ellipse at 80% 30%,#7b5cff 0%,transparent 50%),linear-gradient(180deg,#081325,#0d1b33)"],
    sand: ["Desert", "linear-gradient(160deg,#4a2c2a 0%,#b5654a 50%,#f0c27b 100%)"],
    night: ["Midnight", "radial-gradient(circle at 70% 20%,#2a3a6b 0%,transparent 40%),linear-gradient(180deg,#05070f,#141a2e)"],
    blossom: ["Blossom", "linear-gradient(160deg,#5b3a5e 0%,#c97b9b 55%,#f6d3c8 100%)"],
    slate: ["Slate", "linear-gradient(160deg,#1f2229 0%,#2f343f 100%)"],
    lagoon: ["Lagoon", "linear-gradient(160deg,#134e5e 0%,#3a9e8f 55%,#c4e4a6 100%)"],
  };
  function applyBg() {
    const bg = $("#bg");
    if (S.scene === "custom" && S.customBg) {
      bg.style.background = `#111 url("${S.customBg.replace(/"/g, "%22")}") center/cover no-repeat`;
    } else {
      bg.style.background = (SCENES[S.scene] || SCENES.dusk)[1];
    }
  }
  function renderScenes() {
    $("#sceneList").innerHTML = Object.entries(SCENES).map(([k, [n, css]]) =>
      `<div class="scene ${S.scene === k ? "active" : ""}" data-scene="${k}" style="background:${css}"><span>${n}</span></div>`).join("");
    $("#customBg").value = S.customBg && !S.customBg.startsWith("data:") ? S.customBg : "";
  }
  $("#sceneList").addEventListener("click", (e) => {
    const el = e.target.closest(".scene"); if (!el) return;
    S.scene = el.dataset.scene; save(); applyBg(); renderScenes();
  });
  $("#customBg").addEventListener("change", (e) => {
    const v = e.target.value.trim(); if (!v) return;
    S.customBg = v; S.scene = "custom"; save(); applyBg(); renderScenes();
  });
  $("#bgUpload").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image(); const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        // Downscale to keep localStorage happy
        const max = 1920, scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        S.customBg = c.toDataURL("image/jpeg", 0.82); S.scene = "custom";
        save(); applyBg(); renderScenes(); toast("Background updated");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
  });

  // ---------- Panels ----------
  const panels = { soundsBtn: "#soundsPanel", sceneBtn: "#scenePanel", settingsBtn: "#settingsPanel" };
  Object.entries(panels).forEach(([btn, sel]) => {
    $("#" + btn).addEventListener("click", (e) => {
      e.stopPropagation();
      const p = $(sel); const open = p.classList.contains("hidden");
      $$(".panel").forEach((x) => x.classList.add("hidden"));
      if (open) { p.classList.remove("hidden"); if (sel === "#scenePanel") renderScenes(); }
    });
  });
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest(".panel").classList.add("hidden")));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".panel") && !e.target.closest(".icon-btn")) $$(".panel").forEach((x) => x.classList.add("hidden"));
  });
  $("#fullscreenBtn").addEventListener("click", toggleFullscreen);
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  // ---------- Settings ----------
  const settingMap = {
    setName: ["name", "text"], setFocus: ["focus", "num"], setShort: ["short", "num"], setLong: ["long", "num"],
    setInterval: ["interval", "num"], setAutoBreak: ["autoBreak", "bool"], setAutoFocus: ["autoFocus", "bool"],
    setChime: ["chime", "bool"], setNotify: ["notify", "bool"], setClock24: ["clock24", "bool"], setQuotes: ["quotes", "bool"],
  };
  function loadSettingsUI() {
    for (const [id, [k, t]] of Object.entries(settingMap)) {
      const el = $("#" + id);
      if (t === "bool") el.checked = !!S.settings[k]; else el.value = S.settings[k];
    }
  }
  for (const [id, [k, t]] of Object.entries(settingMap)) {
    $("#" + id).addEventListener("change", (e) => {
      let v = t === "bool" ? e.target.checked : t === "num" ? Math.max(1, parseInt(e.target.value) || 1) : e.target.value.trim();
      S.settings[k] = v; save();
      if (k === "notify" && v && "Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().then((p) => { if (p !== "granted") { S.settings.notify = false; save(); loadSettingsUI(); } });
      }
      if (["focus", "short", "long"].includes(k) && !timer.running) resetTimer();
      tickClock(); renderQuote(); renderToday();
      if ($("#view-planner").classList.contains("active")) renderPlanner();
    });
  }

  // ---------- Audio ----------
  let actx;
  const audio = () => (actx ||= new (window.AudioContext || window.webkitAudioContext)());

  function chime() {
    if (!S.settings.chime) return;
    const ctx = audio(); const t0 = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + i * 0.18);
      g.gain.linearRampToValueAtTime(0.25, t0 + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.18 + 1.4);
      o.connect(g).connect(ctx.destination); o.start(t0 + i * 0.18); o.stop(t0 + i * 0.18 + 1.5);
    });
  }

  function noiseBuffer(ctx, type) {
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === "white") d[i] = w * 0.5;
        else if (type === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else { // pink
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
      }
    }
    return buf;
  }

  const SOUNDS = {
    rain: { label: "Rain", icon: "☂", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "pink"); src.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 400;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6000;
      src.connect(hp).connect(lp).connect(out); src.start(); return [src];
    }},
    ocean: { label: "Ocean waves", icon: "≈", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "brown"); src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
      const g = ctx.createGain(); g.gain.value = 0.5;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.45;
      lfo.connect(lfoG).connect(g.gain);
      src.connect(lp).connect(g).connect(out); src.start(); lfo.start(); return [src, lfo];
    }},
    wind: { label: "Wind", icon: "~", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "white"); src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 1.2;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
      const lfoG = ctx.createGain(); lfoG.gain.value = 300;
      lfo.connect(lfoG).connect(bp.frequency);
      const g = ctx.createGain(); g.gain.value = 0.6;
      src.connect(bp).connect(g).connect(out); src.start(); lfo.start(); return [src, lfo];
    }},
    fire: { label: "Fireplace", icon: "♨", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "brown"); src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500;
      src.connect(lp).connect(out); src.start();
      // crackles
      const len = ctx.sampleRate * 6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) if (Math.random() < 0.00012) {
        const amp = Math.random() * 0.9, n = 80 + Math.random() * 300;
        for (let j = 0; j < n && i + j < len; j++) d[i + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / (n / 5));
      }
      const cr = ctx.createBufferSource(); cr.buffer = buf; cr.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1500;
      cr.connect(hp).connect(out); cr.start(); return [src, cr];
    }},
    cafe: { label: "Café murmur", icon: "☕", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "pink"); src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.value = 0.7;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.7;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.2; lfo.connect(lfoG).connect(g.gain);
      src.connect(bp).connect(g).connect(out); src.start(); lfo.start(); return [src, lfo];
    }},
    white: { label: "White noise", icon: "○", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "white"); src.loop = true;
      const g = ctx.createGain(); g.gain.value = 0.35; src.connect(g).connect(out); src.start(); return [src];
    }},
    brown: { label: "Brown noise", icon: "●", build(ctx, out) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, "brown"); src.loop = true;
      src.connect(out); src.start(); return [src];
    }},
  };
  const live = {};
  function soundState(k) { return (S.sounds[k] ||= { on: false, vol: 0.5 }); }
  function startSound(k) {
    const ctx = audio(); ctx.resume();
    const gain = ctx.createGain(); gain.gain.value = soundState(k).vol; gain.connect(ctx.destination);
    live[k] = { gain, nodes: SOUNDS[k].build(ctx, gain) };
  }
  function stopSound(k) {
    if (!live[k]) return;
    live[k].nodes.forEach((n) => { try { n.stop(); } catch {} });
    live[k].gain.disconnect(); delete live[k];
  }
  function renderSounds() {
    $("#soundList").innerHTML = Object.entries(SOUNDS).map(([k, s]) => {
      const st = soundState(k);
      return `<div class="sound-row"><button data-snd="${k}" class="${live[k] ? "on" : ""}" title="Toggle">${s.icon}</button>
        <label>${s.label}<input type="range" min="0" max="1" step="0.01" value="${st.vol}" data-vol="${k}" /></label></div>`;
    }).join("");
  }
  $("#soundList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-snd]"); if (!b) return;
    const k = b.dataset.snd;
    if (live[k]) { stopSound(k); soundState(k).on = false; } else { startSound(k); soundState(k).on = true; }
    save(); renderSounds();
  });
  $("#soundList").addEventListener("input", (e) => {
    const k = e.target.dataset.vol; if (!k) return;
    soundState(k).vol = +e.target.value;
    if (live[k]) live[k].gain.gain.setTargetAtTime(+e.target.value, audio().currentTime, 0.05);
    save();
  });

  // ---------- Timer ----------
  const timer = { mode: "focus", running: false, endAt: 0, remaining: 0, total: 0, session: 1, interval: null };
  const modeLen = (m) => S.settings[m === "focus" ? "focus" : m] * 60;
  const MODE_LABEL = { focus: "Focus", short: "Short break", long: "Long break" };

  function setMode(m) {
    timer.mode = m;
    $$(".mode-switch .mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
    resetTimer();
  }
  function resetTimer() {
    stopTicking(); timer.running = false;
    timer.total = timer.remaining = modeLen(timer.mode);
    renderTimer();
  }
  function startTimer() {
    audio().resume?.();
    timer.running = true; timer.endAt = Date.now() + timer.remaining * 1000;
    stopTicking(); timer.interval = setInterval(tick, 250); renderTimer();
    if (timer.mode === "focus") document.body.classList.add("zen");
  }
  function pauseTimer() {
    timer.remaining = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
    timer.running = false; stopTicking(); renderTimer();
    document.body.classList.remove("zen");
  }
  function stopTicking() { clearInterval(timer.interval); timer.interval = null; }
  function tick() {
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    renderTimer();
    if (timer.remaining <= 0) complete(true);
  }
  function complete(natural) {
    stopTicking(); timer.running = false; document.body.classList.remove("zen");
    const finished = timer.mode;
    if (finished === "focus") {
      const mins = natural ? S.settings.focus : Math.round((timer.total - timer.remaining) / 60);
      if (natural) {
        logFocus(mins);
        const t = S.tasks.find((x) => x.id === S.selectedTask);
        if (t) t.doneP = (t.doneP || 0) + 1;
        save(); renderTasks();
      }
      const next = timer.session % S.settings.interval === 0 ? "long" : "short";
      if (natural) timer.session++;
      setMode(next);
      if (natural) { chime(); notify("Focus session complete", "Time for a " + MODE_LABEL[next].toLowerCase() + "."); }
      if (natural && S.settings.autoBreak) startTimer();
    } else {
      setMode("focus");
      if (natural) { chime(); notify("Break's over", "Ready to focus again?"); }
      if (natural && S.settings.autoFocus) startTimer();
    }
  }
  function notify(title, body) {
    if (S.settings.notify && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }
  function logFocus(mins) {
    const k = ymd(new Date());
    const h = (S.history[k] ||= { min: 0, sessions: 0 });
    h.min += mins; h.sessions += 1;
  }
  function renderTimer() {
    const r = timer.remaining, mm = Math.floor(r / 60), ss = r % 60;
    const txt = `${pad(mm)}:${pad(ss)}`;
    $("#timer").textContent = txt;
    $("#progressBar").style.width = `${timer.total ? (1 - r / timer.total) * 100 : 0}%`;
    $("#startBtn").textContent = timer.running ? "Pause" : (r < timer.total ? "Resume" : "Start");
    document.title = timer.running || r < timer.total ? `${txt} · ${MODE_LABEL[timer.mode]} — Stillpoint` : "Stillpoint — Focus & Planner";
    const today = S.history[ymd(new Date())];
    $("#sessionCount").textContent = `Session ${timer.session} · ${today ? today.sessions : 0} done today`;
  }
  $("#startBtn").addEventListener("click", () => (timer.running ? pauseTimer() : startTimer()));
  $("#resetBtn").addEventListener("click", resetTimer);
  $("#skipBtn").addEventListener("click", () => complete(false));
  $$(".mode-switch .mode").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  // ---------- Tasks ----------
  function renderTasks() {
    const ul = $("#taskList");
    if (!S.tasks.length) ul.innerHTML = `<li class="empty">Nothing yet. Add what you want to get done.</li>`;
    else ul.innerHTML = S.tasks.map((t) => `
      <li class="task ${t.done ? "done" : ""} ${S.selectedTask === t.id ? "selected" : ""}" data-id="${t.id}">
        <button class="checkbox" data-act="toggle" title="Done">${t.done ? "✓" : ""}</button>
        <span class="task-title">${esc(t.title)}</span>
        <span class="task-meta">${t.doneP || 0}/${t.est || 1}</span>
        <button class="del" data-act="del" title="Delete">✕</button>
      </li>`).join("");
    const sel = S.tasks.find((t) => t.id === S.selectedTask);
    $("#currentTask").innerHTML = sel ? `Working on: <b>${esc(sel.title)}</b>` : "No task selected — pick one from your list";
  }
  $("#taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#taskInput").value.trim(); if (!title) return;
    const t = { id: uid(), title, done: false, est: Math.max(1, +$("#taskPomos").value || 1), doneP: 0 };
    S.tasks.push(t); if (!S.selectedTask) S.selectedTask = t.id;
    $("#taskInput").value = ""; $("#taskPomos").value = 1; save(); renderTasks();
  });
  $("#taskList").addEventListener("click", (e) => {
    const li = e.target.closest(".task"); if (!li) return;
    const t = S.tasks.find((x) => x.id === li.dataset.id);
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "toggle") { t.done = !t.done; if (t.done && S.selectedTask === t.id) S.selectedTask = null; }
    else if (act === "del") { S.tasks = S.tasks.filter((x) => x !== t); if (S.selectedTask === t.id) S.selectedTask = null; }
    else S.selectedTask = S.selectedTask === t.id ? null : t.id;
    save(); renderTasks();
  });
  $("#clearDoneBtn").addEventListener("click", () => { S.tasks = S.tasks.filter((t) => !t.done); save(); renderTasks(); });

  // ---------- Planner ----------
  const COLORS = ["#f2a65a", "#6fb3ff", "#7ed6a5", "#e58bd0", "#f06b6b", "#c9b6ff"];
  let weekStart = startOfWeek(new Date());
  let pview = "week";
  let dayCursor = new Date();
  const byTime = (a, b) => (toMin(a.start) ?? -1) - (toMin(b.start) ?? -1) || a.title.localeCompare(b.title);
  const plansOn = (key) => S.plans.filter((p) => p.date === key).sort(byTime);
  const weekKey = () => ymd(weekStart);

  function planItemHTML(p, extra = "") {
    const time = p.start ? `${fmtTime(p.start)}${p.end ? "–" + fmtTime(p.end) : ""}` : "";
    return `<div class="plan-item ${p.done ? "done" : ""}" data-pid="${p.id}" draggable="true" style="--c:${p.color || COLORS[0]};${extra}">
      <button class="checkbox" data-pact="toggle" title="Done" style="${p.done ? `background:${p.color};border-color:${p.color}` : ""}">${p.done ? "✓" : ""}</button>
      <div class="pi-body">${time ? `<div class="pi-time">${time}</div>` : ""}<div class="pi-title">${esc(p.title)}</div></div>
    </div>`;
  }

  function renderPlanner() {
    const todayK = ymd(new Date());
    const end = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    if (pview === "week") {
      $("#weekLabel").textContent = sameMonth
        ? `${weekStart.toLocaleDateString(undefined, { month: "long" })} ${weekStart.getDate()}–${end.getDate()}, ${end.getFullYear()}`
        : `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
      $("#weekGrid").classList.remove("hidden"); $("#dayView").classList.add("hidden");
      let html = "";
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i), k = ymd(d);
        html += `<div class="day-col ${k === todayK ? "today" : ""}" data-date="${k}">
          <div class="day-col-head" data-openday="${k}"><span class="dname">${d.toLocaleDateString(undefined, { weekday: "short" })}</span><span class="dnum">${d.getDate()}</span></div>
          ${plansOn(k).map((p) => planItemHTML(p)).join("")}
          <button class="add-quick" data-add="${k}">+ Add</button>
        </div>`;
      }
      $("#weekGrid").innerHTML = html;
    } else renderDay();
    // side
    const goals = S.goals[weekKey()] || [];
    $("#goalList").innerHTML = goals.length ? goals.map((g) => `
      <li class="task ${g.done ? "done" : ""}" data-gid="${g.id}">
        <button class="checkbox" data-act="toggle">${g.done ? "✓" : ""}</button>
        <span class="task-title">${esc(g.title)}</span>
        <button class="del" data-act="del">✕</button></li>`).join("") : `<li class="empty">What would make this week a win?</li>`;
    $("#weekNotes").value = S.notes[weekKey()] || "";
  }

  function renderDay() {
    const k = ymd(dayCursor);
    $("#weekLabel").textContent = dayCursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    $("#weekGrid").classList.add("hidden"); $("#dayView").classList.remove("hidden");
    const items = plansOn(k);
    const unsched = items.filter((p) => !p.start), sched = items.filter((p) => p.start);
    const H = 48;
    let rows = "";
    for (let h = 0; h < 24; h++) {
      const label = S.settings.clock24 ? `${pad(h)}:00` : `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
      rows += `<div class="hour-label">${h ? label : ""}</div><div class="hour-slot" data-hour="${h}"></div>`;
    }
    // Simple overlap layout: assign columns
    const placed = []; const cols = [];
    sched.forEach((p) => {
      const s = toMin(p.start), e = Math.max(s + 20, toMin(p.end) ?? s + 60);
      let c = 0; while (cols[c] && cols[c] > s) c++;
      cols[c] = e; placed.push({ p, s, e, c });
    });
    const ncol = Math.max(1, cols.length);
    const blocks = placed.map(({ p, s, e, c }) =>
      planItemHTML(p, `top:${(s / 60) * H}px;height:${((e - s) / 60) * H - 2}px;left:calc(${(c / ncol) * 100}% + 6px);right:auto;width:calc(${100 / ncol}% - 12px);`)).join("");
    const now = new Date();
    const nowLine = k === ymd(now) ? `<div class="now-line" style="top:${((now.getHours() * 60 + now.getMinutes()) / 60) * H}px"></div>` : "";
    $("#dayView").innerHTML = `
      ${unsched.length ? `<div class="unscheduled"><h4>Anytime</h4><div class="plan-list">${unsched.map((p) => planItemHTML(p)).join("")}</div></div>` : ""}
      <div class="day-timeline" id="timeline">${rows}<div class="timeline-items">${blocks}</div>${nowLine}</div>`;
    const tl = $("#timeline"); tl.scrollTop = 7 * H;
  }

  function shift(n) {
    if (pview === "week") weekStart = addDays(weekStart, 7 * n);
    else { dayCursor = addDays(dayCursor, n); weekStart = startOfWeek(dayCursor); }
    renderPlanner();
  }
  $("#prevWeek").addEventListener("click", () => shift(-1));
  $("#nextWeek").addEventListener("click", () => shift(1));
  $("#todayWeek").addEventListener("click", () => { dayCursor = new Date(); weekStart = startOfWeek(dayCursor); renderPlanner(); });
  $$("[data-pview]").forEach((b) => b.addEventListener("click", () => setPview(b.dataset.pview)));
  function setPview(v) {
    pview = v;
    $$("[data-pview]").forEach((x) => x.classList.toggle("active", x.dataset.pview === v));
    if (v === "day" && (dayCursor < weekStart || dayCursor >= addDays(weekStart, 7))) dayCursor = new Date(weekStart);
    renderPlanner();
  }
  $("#addPlanBtn").addEventListener("click", () => openPlan(null, { date: ymd(pview === "day" ? dayCursor : new Date()) }));

  function handlePlanClick(e) {
    const add = e.target.closest("[data-add]");
    if (add) return openPlan(null, { date: add.dataset.add });
    const od = e.target.closest("[data-openday]");
    if (od) { dayCursor = parseYmd(od.dataset.openday); return setPview("day"); }
    const slot = e.target.closest(".hour-slot");
    if (slot) { const h = +slot.dataset.hour; return openPlan(null, { date: ymd(dayCursor), start: `${pad(h)}:00`, end: `${pad((h + 1) % 24)}:00` }); }
    const item = e.target.closest(".plan-item"); if (!item) return;
    const p = S.plans.find((x) => x.id === item.dataset.pid);
    if (e.target.closest("[data-pact=toggle]")) { p.done = !p.done; save(); renderPlanner(); renderToday(); return; }
    openPlan(p);
  }
  $("#weekGrid").addEventListener("click", handlePlanClick);
  $("#dayView").addEventListener("click", handlePlanClick);

  // drag & drop between days
  let dragId = null;
  $("#weekGrid").addEventListener("dragstart", (e) => {
    const it = e.target.closest(".plan-item"); if (!it) return;
    dragId = it.dataset.pid; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId);
  });
  $("#weekGrid").addEventListener("dragover", (e) => {
    const col = e.target.closest(".day-col"); if (!col || !dragId) return;
    e.preventDefault(); $$(".day-col").forEach((c) => c.classList.toggle("drag-over", c === col));
  });
  $("#weekGrid").addEventListener("dragleave", (e) => { if (!e.relatedTarget?.closest?.(".day-col")) $$(".day-col").forEach((c) => c.classList.remove("drag-over")); });
  $("#weekGrid").addEventListener("drop", (e) => {
    const col = e.target.closest(".day-col"); if (!col || !dragId) return;
    e.preventDefault();
    const p = S.plans.find((x) => x.id === dragId); if (p) p.date = col.dataset.date;
    dragId = null; save(); renderPlanner(); renderToday();
  });
  $("#weekGrid").addEventListener("dragend", () => { dragId = null; $$(".day-col").forEach((c) => c.classList.remove("drag-over")); });

  // Modal
  let editing = null, pickedColor = COLORS[0];
  function openPlan(p, preset = {}) {
    editing = p;
    $("#planModalTitle").textContent = p ? "Edit item" : "New item";
    const v = p || { title: "", date: ymd(new Date()), start: "", end: "", notes: "", color: COLORS[0], ...preset };
    $("#planTitle").value = v.title; $("#planDate").value = v.date;
    $("#planStart").value = v.start || ""; $("#planEnd").value = v.end || ""; $("#planNotes").value = v.notes || "";
    pickedColor = v.color || COLORS[0]; renderSwatches();
    $("#planDelete").classList.toggle("hidden", !p);
    $("#planModal").classList.remove("hidden"); setTimeout(() => $("#planTitle").focus(), 30);
  }
  function closePlan() { $("#planModal").classList.add("hidden"); editing = null; }
  function renderSwatches() {
    $("#planColors").innerHTML = COLORS.map((c) => `<button type="button" class="swatch ${c === pickedColor ? "active" : ""}" data-color="${c}" style="background:${c}"></button>`).join("");
  }
  $("#planColors").addEventListener("click", (e) => { const s = e.target.closest("[data-color]"); if (s) { pickedColor = s.dataset.color; renderSwatches(); } });
  $("#planCancel").addEventListener("click", closePlan);
  $("#planModal").addEventListener("click", (e) => { if (e.target.id === "planModal") closePlan(); });
  $("#planDelete").addEventListener("click", () => {
    if (editing) S.plans = S.plans.filter((x) => x !== editing);
    save(); closePlan(); renderPlanner(); renderToday();
  });
  $("#planForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      title: $("#planTitle").value.trim(), date: $("#planDate").value,
      start: $("#planStart").value, end: $("#planEnd").value, notes: $("#planNotes").value.trim(), color: pickedColor,
    };
    if (!data.title || !data.date) return;
    if (data.start && data.end && toMin(data.end) <= toMin(data.start)) { toast("End time must be after start time"); return; }
    if (editing) Object.assign(editing, data);
    else S.plans.push({ id: uid(), done: false, ...data });
    save(); closePlan(); renderPlanner(); renderToday();
  });

  // Goals & notes
  $("#goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#goalInput").value.trim(); if (!v) return;
    (S.goals[weekKey()] ||= []).push({ id: uid(), title: v, done: false });
    $("#goalInput").value = ""; save(); renderPlanner();
  });
  $("#goalList").addEventListener("click", (e) => {
    const li = e.target.closest("[data-gid]"); if (!li) return;
    const list = S.goals[weekKey()] || []; const g = list.find((x) => x.id === li.dataset.gid);
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "del") S.goals[weekKey()] = list.filter((x) => x !== g);
    else g.done = !g.done;
    save(); renderPlanner();
  });
  let notesTimer;
  $("#weekNotes").addEventListener("input", (e) => {
    clearTimeout(notesTimer);
    const k = weekKey(), v = e.target.value;
    notesTimer = setTimeout(() => { S.notes[k] = v; save(); }, 400);
  });

  // Today's plan on focus view
  function renderToday() {
    const items = plansOn(ymd(new Date()));
    $("#todayList").innerHTML = items.length
      ? items.map((p) => `<li>${planItemHTML(p).replace('draggable="true"', "")}</li>`).join("")
      : `<li class="empty">Nothing planned for today. Open the planner to block out your day.</li>`;
  }
  $("#todayList").addEventListener("click", (e) => {
    const item = e.target.closest(".plan-item"); if (!item) return;
    const p = S.plans.find((x) => x.id === item.dataset.pid);
    if (e.target.closest("[data-pact=toggle]")) { p.done = !p.done; save(); renderToday(); return; }
    // Click a plan item → focus on it as a task
    let t = S.tasks.find((x) => x.planId === p.id);
    if (!t) { t = { id: uid(), title: p.title, done: false, est: 1, doneP: 0, planId: p.id }; S.tasks.push(t); }
    S.selectedTask = t.id; save(); renderTasks(); toast(`Focusing on “${p.title}”`);
  });

  // ---------- Stats ----------
  function renderStats() {
    const now = new Date(), todayK = ymd(now);
    const get = (d) => S.history[ymd(d)] || { min: 0, sessions: 0 };
    $("#statToday").textContent = get(now).min;
    let wk = 0; const ws = startOfWeek(now);
    for (let i = 0; i < 7; i++) wk += get(addDays(ws, i)).min;
    $("#statWeek").textContent = wk;
    $("#statSessions").textContent = Object.values(S.history).reduce((a, h) => a + h.sessions, 0);
    let streak = 0, d = new Date(now);
    if (!S.history[todayK]) d = addDays(d, -1);
    while (S.history[ymd(d)]?.sessions) { streak++; d = addDays(d, -1); }
    $("#statStreak").textContent = streak;
    const days = [...Array(14)].map((_, i) => addDays(now, i - 13));
    const max = Math.max(30, ...days.map((x) => get(x).min));
    $("#chart").innerHTML = days.map((x) => {
      const m = get(x).min;
      return `<div class="bar-wrap" title="${x.toDateString()}: ${m} min"><span class="bar-val">${m || ""}</span>
        <div class="bar" style="height:${(m / max) * 100}%;${ymd(x) === todayK ? "" : "opacity:.7"}"></div>
        <span class="bar-label">${x.toLocaleDateString(undefined, { weekday: "narrow" })}</span></div>`;
    }).join("");
  }
  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `stillpoint-backup-${ymd(new Date())}.json`; a.click(); URL.revokeObjectURL(a.href);
  });
  $("#importFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((txt) => {
      try {
        const data = JSON.parse(txt);
        if (typeof data !== "object" || !data) throw 0;
        S = Object.assign(defaults(), data); S.settings = Object.assign(defaults().settings, data.settings || {});
        save(); boot(); toast("Data imported");
      } catch { toast("That file doesn't look like a Stillpoint backup"); }
    });
  });

  // ---------- Keyboard ----------
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.key === "Escape") { closePlan(); $$(".panel").forEach((x) => x.classList.add("hidden")); }
    if (e.code === "Space" && $("#view-focus").classList.contains("active")) { e.preventDefault(); $("#startBtn").click(); }
    if (e.key === "f") toggleFullscreen();
    if (e.key === "n" && $("#view-planner").classList.contains("active")) { e.preventDefault(); $("#addPlanBtn").click(); }
  });

  // ---------- Boot ----------
  function boot() {
    applyBg(); tickClock(); renderQuote(); loadSettingsUI();
    renderTasks(); renderToday(); renderSounds(); resetTimer();
  }
  boot();
  // Refresh "today" bits around midnight / periodically
  setInterval(() => { renderToday(); const nl = $(".now-line"); if (nl) { const n = new Date(); nl.style.top = `${((n.getHours() * 60 + n.getMinutes()) / 60) * 48}px`; } }, 60_000);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
