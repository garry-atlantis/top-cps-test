// ====== CPS & REAKSIYON TESTI ======

const INAPPROPRIATE_WORDS = [
    'porno', 'sex', 'sexy', 'fuck', 'shit', 'ass', 'dick', 'cock', 'pussy',
    'bitch', 'whore', 'slut', 'nigger', 'nigga', 'retard', 'gay', 'fag',
    'cum', 'porn', 'xxx', 'nsfw', 'kuf', 'amk', 'oç', 'sik',
    'siktir', 'orospu', 'pezevenk', 'yarrak', 'amcık', 'göt', 'piç',
    'ibne', 'döl', 'sürtük', 'kahpe', 'keriz', 'sapık'
];

function isInappropriateName(name) {
    const lower = name.toLowerCase().replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/g, '');
    return INAPPROPRIATE_WORDS.some(word => lower.includes(word));
}

// Check if name is already taken by another player in the leaderboard.
// Returns true if taken (and not by the current registered user).
async function isNameTaken(name) {
    const data = await fetchLeaderboard();
    const lname = name.toLowerCase();
    const myName = (state.registeredName || '').toLowerCase();
    return data.some(e => e.name && e.name.toLowerCase() === lname && lname !== myName);
}

const JSONBIN_CONFIG = {
    API_KEY: '$2a$10$af0DhWYHHPpquLjKOUrNEe/QyqURuUFDb2ezuqq.KHballN7UeMAy',
    BIN_ID: '69f5121e36566621a814de8a',
    BASE_URL: 'https://api.jsonbin.io/v3',
};

const IMGBB_API_KEY = '4f95844c7578cccb02888e4a96559243';

const state = {
    clicks: [], totalClicks: 0,
    maxCps: parseInt(localStorage.getItem('maxCps')) || 0,
    currentCps: 0,
    bestStreak: parseInt(localStorage.getItem('bestStreak')) || 0,
    currentStreak: 0,
    isRunning: false, gameEnded: false,
    startTime: null, timeLimit: 5, animFrameId: null,
    lastSessionCps: 0, lastSessionMode: 5,
    isCountdown: false,
    gameType: 'cps',
    leaderboardData: null, leaderboardTab: 'cps',
    registeredName: localStorage.getItem('registeredName') || '',
    nameChangeUsed: localStorage.getItem('nameChangeUsed') === 'true',
    reactionState: 'idle', reactionTimer: null,
    reactionStartTime: 0, reactionTimes: [],
    reactionBest: parseInt(localStorage.getItem('reactionBest')) || 0,
    reactionRound: 0, reactionMaxRounds: 5,
    lastReactionTime: 0,
    muted: localStorage.getItem('muted') === 'true',
    forceRename: false,
    // Accuracy
    accuracyState: 'idle', accuracyHits: 0, accuracyMisses: 0,
    accuracyTimer: null, accuracyEndTime: 0, accuracyDuration: 20,
    accuracyBest: parseInt(localStorage.getItem('accuracyBest')) || 0,
    lastAccuracyScore: 0, lastAccuracyAccuracy: 0,
    // Number game
    numberState: 'idle', numberNext: 1, numberStartTime: 0,
    numberOrder: [], numberTimerInterval: null,
    numberBest: parseInt(localStorage.getItem('numberBest')) || 0,
    lastNumberTime: 0,
    // Color test
    colorState: 'idle', colorCorrect: 0, colorWrong: 0,
    colorTimer: null, colorEndTime: 0, colorDuration: 30,
    colorTargetColor: '', colorTargetWord: '',
    colorBest: parseInt(localStorage.getItem('colorBest')) || 0,
    lastColorScore: 0,
    // UI prefs
    avatar: localStorage.getItem('avatar') || '😎',
    theme: localStorage.getItem('theme') || 'dark',
};

// ====== DOM ======
const maxCpsValue = document.getElementById('max-cps-value');
const currentCpsValue = document.getElementById('current-cps-value');
const statMax = document.getElementById('stat-max');
const statCurrent = document.getElementById('stat-current');
const statTotal = document.getElementById('stat-total');
const statStreak = document.getElementById('stat-streak');
const clickButton = document.getElementById('click-button');
const clickCount = document.getElementById('click-count');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');
const rippleContainer = document.getElementById('click-ripple-container');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');
const playerNameInput = document.getElementById('player-name-input');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardOverlay = document.getElementById('leaderboard-overlay');
const leaderboardClose = document.getElementById('leaderboard-close');
const leaderboardList = document.getElementById('leaderboard-list');
const submitScoreBtn = document.getElementById('submit-score-btn');
const lbTabs = document.querySelectorAll('.lb-tab');
const changeNameBtn = document.getElementById('change-name-btn');
const nameModal = document.getElementById('name-modal');
const nameModalInput = document.getElementById('name-modal-input');
const nameModalConfirm = document.getElementById('name-modal-confirm');
const nameModalCancel = document.getElementById('name-modal-cancel');
const nameModalText = document.getElementById('name-modal-text');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const gameTypeBtns = document.querySelectorAll('.game-type-btn');
const cpsSection = document.getElementById('cps-section');
const reactionSection = document.getElementById('reaction-section');
const reactionBox = document.getElementById('reaction-box');
const reactionText = document.getElementById('reaction-text');
const reactionSub = document.getElementById('reaction-sub');
const reactionResultValue = document.getElementById('reaction-result-value');
const statReactionBest = document.getElementById('stat-reaction-best');
const statReactionAvg = document.getElementById('stat-reaction-avg');
const statReactionRound = document.getElementById('stat-reaction-round');
const statReactionWorst = document.getElementById('stat-reaction-worst');
const muteBtn = document.getElementById('mute-btn');
const reactionHistorySlots = document.querySelectorAll('.reaction-history-slot');

// Accuracy
const accuracySection = document.getElementById('accuracy-section');
const accuracyZone = document.getElementById('accuracy-zone');
const accuracyTarget = document.getElementById('accuracy-target');
const accuracyMessage = document.getElementById('accuracy-message');
const accHits = document.getElementById('acc-hits');
const accMisses = document.getElementById('acc-misses');
const accTimer = document.getElementById('acc-timer');
const statAccBest = document.getElementById('stat-acc-best');
const statAccPct = document.getElementById('stat-acc-pct');

// Number game
const numberSection = document.getElementById('number-section');
const numberGrid = document.getElementById('number-grid');
const numberStartBtn = document.getElementById('number-start-btn');
const numNext = document.getElementById('num-next');
const numTimer = document.getElementById('num-timer');
const statNumBest = document.getElementById('stat-num-best');
const statNumLast = document.getElementById('stat-num-last');

// Color test
const colorSection = document.getElementById('color-section');
const colorDisplayZone = document.getElementById('color-display-zone');
const colorDisplayText = document.getElementById('color-display-text');
const colorCorrectEl = document.getElementById('color-correct');
const colorWrongEl = document.getElementById('color-wrong');
const colorTimerVal = document.getElementById('color-timer-val');
const colorButtons = document.querySelectorAll('.color-btn');
const statColorBest = document.getElementById('stat-color-best');
const statColorPct = document.getElementById('stat-color-pct');

// Theme & Avatar
const themeBtn = document.getElementById('theme-btn');
const themeModal = document.getElementById('theme-modal');
const themeClose = document.getElementById('theme-close');
const themeOptions = document.querySelectorAll('.theme-option');
const avatarBtn = document.getElementById('avatar-btn');
const avatarModal = document.getElementById('avatar-modal');
const avatarClose = document.getElementById('avatar-close');
const avatarGrid = document.getElementById('avatar-grid');

// ====== SOUND ======
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }
function soundEnabled() { return !state.muted; }

function playClickSound() {
    if (!soundEnabled()) return;
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 800 + Math.random() * 400; osc.type = 'sine';
        gain.gain.value = 0.015; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
}

function playEndSound() {
    if (!soundEnabled()) return;
    try {
        const ctx = getAudioCtx();
        [{ f: 523, t: 0, d: 0.3 }, { f: 659, t: 0.15, d: 0.5 }].forEach(n => {
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = n.f; osc.type = 'sine';
            gain.gain.value = 0.08; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.d);
            osc.start(ctx.currentTime + n.t); osc.stop(ctx.currentTime + n.d);
        });
    } catch(e) {}
}

function playCountdownBeep() {
    if (!soundEnabled()) return;
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440; osc.type = 'sine';
        gain.gain.value = 0.06; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
}

function playGoBeep() {
    if (!soundEnabled()) return;
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = 'sine';
        gain.gain.value = 0.08; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
}

function playReactionGo() {
    if (!soundEnabled()) return;
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 600; osc.type = 'sine';
        gain.gain.value = 0.1; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

function playReactionEarly() {
    if (!soundEnabled()) return;
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 200; osc.type = 'sawtooth';
        gain.gain.value = 0.06; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
}

// ====== INIT ======
function init() {
    maxCpsValue.textContent = state.maxCps;
    statMax.textContent = state.maxCps;
    statStreak.textContent = state.bestStreak;
    if (state.reactionBest) statReactionBest.textContent = state.reactionBest + 'ms';
    const savedName = localStorage.getItem('playerName') || '';
    playerNameInput.value = savedName;
    if (state.registeredName) {
        playerNameInput.readOnly = true;
        if (hasUnlimitedNameChange()) {
            changeNameBtn.style.display = '';
        } else if (state.nameChangeUsed) {
            changeNameBtn.style.display = 'none';
        }
    }

    // Mute button setup
    updateMuteButton();
    muteBtn.addEventListener('click', () => {
        state.muted = !state.muted;
        localStorage.setItem('muted', state.muted);
        updateMuteButton();
    });

    // Changelog modal
    const changelogBtn = document.getElementById('changelog-btn');
    const changelogModal = document.getElementById('changelog-modal');
    const changelogClose = document.getElementById('changelog-close');
    if (changelogBtn) {
        updateChangelogVisibility();
        changelogBtn.addEventListener('click', () => changelogModal.classList.add('open'));
        changelogClose.addEventListener('click', () => changelogModal.classList.remove('open'));
        changelogModal.addEventListener('click', (e) => {
            if (e.target === changelogModal) changelogModal.classList.remove('open');
        });
    }

    // Force rename if registered name is inappropriate
    if (state.registeredName && isInappropriateName(state.registeredName)) {
        forceInappropriateRename();
    }

    // Admin panel
    initAdminPanel();
    // Theme & Avatar
    initTheme();
    initAvatar();
    initProfile();
}

function initAdminPanel() {
    const adminBtn = document.getElementById('admin-btn');
    const adminModal = document.getElementById('admin-modal');
    const adminClose = document.getElementById('admin-close');
    const adminRefresh = document.getElementById('admin-refresh-btn');
    const adminSearch = document.getElementById('admin-search');
    const adminTabs = document.querySelectorAll('.admin-tab');
    if (!adminBtn) return;

    let adminTab = 'cps';

    adminBtn.addEventListener('click', async () => {
        adminModal.classList.add('open');
        await renderAdminList(adminTab);
    });
    adminClose.addEventListener('click', () => adminModal.classList.remove('open'));
    adminModal.addEventListener('click', (e) => { if (e.target === adminModal) adminModal.classList.remove('open'); });
    adminRefresh.addEventListener('click', async () => {
        state.leaderboardData = null; state.lbCacheTime = 0;
        await renderAdminList(adminTab);
    });
    adminSearch.addEventListener('input', () => renderAdminList(adminTab, adminSearch.value));
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            adminTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            adminTab = tab.dataset.type;
            renderAdminList(adminTab, adminSearch.value);
        });
    });
}

const ADMIN_LABELS = { cps: 'CPS', reaction: 'Reaksiyon', accuracy: 'Doğruluk', number: 'Sayı', color: 'Renk' };

async function renderAdminList(tabType, search = '') {
    const adminList = document.getElementById('admin-list');
    adminList.innerHTML = '<div style="text-align:center;color:#7a8a9a;padding:20px">Yükleniyor...</div>';
    const data = await fetchLeaderboard();
    let entries = [];
    let scoreFmt = () => '';

    if (tabType === 'cps') {
        const cpsEntries = data.filter(e => !e.type || e.type === 'cps');
        const best = {};
        cpsEntries.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || (e.cps || 0) > (best[k].cps || 0)) best[k] = e; });
        entries = Object.values(best).sort((a, b) => (b.cps || 0) - (a.cps || 0));
        scoreFmt = (e) => `${e.cps} CPS`;
    } else if (tabType === 'reaction') {
        const r = data.filter(e => e.type === 'reaction' && typeof e.time === 'number');
        const best = {};
        r.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.time < best[k].time) best[k] = e; });
        entries = Object.values(best).sort((a, b) => a.time - b.time);
        scoreFmt = (e) => `${e.time} ms`;
    } else if (tabType === 'accuracy') {
        const a = data.filter(e => e.type === 'accuracy' && typeof e.score === 'number');
        const best = {};
        a.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.score > best[k].score) best[k] = e; });
        entries = Object.values(best).sort((a, b) => b.score - a.score);
        scoreFmt = (e) => `${e.score} vuruş`;
    } else if (tabType === 'number') {
        const n = data.filter(e => e.type === 'number' && typeof e.time === 'number');
        const best = {};
        n.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.time < best[k].time) best[k] = e; });
        entries = Object.values(best).sort((a, b) => a.time - b.time);
        scoreFmt = (e) => `${(e.time / 1000).toFixed(2)} sn`;
    } else if (tabType === 'color') {
        const c = data.filter(e => e.type === 'color' && typeof e.score === 'number');
        const best = {};
        c.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.score > best[k].score) best[k] = e; });
        entries = Object.values(best).sort((a, b) => b.score - a.score);
        scoreFmt = (e) => `${e.score} doğru`;
    }

    if (search) entries = entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    if (entries.length === 0) {
        adminList.innerHTML = '<div style="text-align:center;color:#7a8a9a;padding:20px">Kayıt bulunamadı</div>';
        return;
    }
    adminList.innerHTML = entries.map((e, i) => {
        const rank = i + 1;
        return `<div class="admin-row">
            <div class="admin-row-info">
                <span class="admin-row-name">${rank}. ${escapeHtml(e.name)}</span>
                <span class="admin-row-score">${scoreFmt(e)}</span>
            </div>
            <button class="admin-delete-btn" data-name="${escapeHtml(e.name)}">🗑 Sil</button>
        </div>`;
    }).join('');
    adminList.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const name = btn.dataset.name;
            if (!confirm(`"${name}" adlı oyuncunun tüm ${ADMIN_LABELS[tabType]} skorları silinecek. Emin misin?`)) return;
            btn.textContent = 'Siliniyor...'; btn.disabled = true;
            await adminDeletePlayer(name, tabType);
            await renderAdminList(tabType, document.getElementById('admin-search').value);
        });
    });
}

async function adminDeletePlayer(name, tabType) {
    const data = state.leaderboardData || await fetchLeaderboard();
    const filtered = data.filter(e => {
        const nameMatch = e.name.toLowerCase() === name.toLowerCase();
        if (!nameMatch) return true;
        // Keep entries that don't belong to the targeted tab type
        const eType = e.type || 'cps';
        return eType !== tabType;
    });
    if (isJsonBinConfigured()) {
        try {
            await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY },
                body: JSON.stringify({ scores: filtered })
            });
        } catch(err) { console.error('Admin delete error:', err); return; }
    } else {
        localStorage.setItem('leaderboard', JSON.stringify(filtered));
    }
    state.leaderboardData = filtered;
    localStorage.setItem('leaderboardCache', JSON.stringify(filtered));
    renderLeaderboard(filtered, state.leaderboardTab);
}

function updateMuteButton() {
    muteBtn.textContent = state.muted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', state.muted);
}

function updateChangelogVisibility() {
    const btn = document.getElementById('changelog-btn');
    const adminBtn = document.getElementById('admin-btn');
    if (!btn) return;
    const name = (state.registeredName || playerNameInput.value.trim()).toLowerCase();
    const isAdmin = name === 'everseekn';
    btn.style.display = isAdmin ? '' : 'none';
    if (adminBtn) adminBtn.style.display = isAdmin ? '' : 'none';
}

function hasUnlimitedNameChange(nameToCheck = null) {
    if (localStorage.getItem('unlimitedNameChange') === 'true') return true;
    const name = (nameToCheck || state.registeredName || playerNameInput.value.trim()).toLowerCase();
    if (name === 'shoso') {
        localStorage.setItem('unlimitedNameChange', 'true');
        return true;
    }
    return false;
}

function forceInappropriateRename() {
    state.forceRename = true;
    // Allow change again — bypass nameChangeUsed lock for inappropriate names
    state.nameChangeUsed = false;
    localStorage.removeItem('nameChangeUsed');
    changeNameBtn.style.display = '';
    playerNameInput.readOnly = false;

    nameModalText.innerHTML = '<b>Uygunsuz isim tespit edildi!</b><br>Lütfen yeni bir isim seç. Eski skorlarınız yeni isme aktarılacak.';
    nameModalInput.value = '';
    nameModalInput.placeholder = 'Yeni isim...';
    nameModalCancel.style.display = 'none';
    nameModal.classList.add('open');
    setTimeout(() => nameModalInput.focus(), 100);
}

// ====== GAME TYPE SELECTOR ======
const GAME_TITLES = {
    cps: 'CPS TEST',
    reaction: 'REAKSİYON TESTİ',
    accuracy: 'DOĞRULUK TESTİ',
    number: 'SAYI TESTİ',
    color: 'RENK TESTİ',
};

gameTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.isRunning || state.isCountdown || state.accuracyState === 'running' || state.numberState === 'running' || state.colorState === 'running') return;
        gameTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.gameType = btn.dataset.type;

        // Hide all sections
        cpsSection.style.display = 'none';
        reactionSection.style.display = 'none';
        accuracySection.style.display = 'none';
        numberSection.style.display = 'none';
        colorSection.style.display = 'none';

        // Reset other modes' last scores so submit picks correct one
        state.lastSessionCps = 0;
        state.lastReactionTime = 0;
        state.lastAccuracyScore = 0;
        state.lastNumberTime = 0;
        state.lastColorScore = 0;

        document.querySelector('#header h1').textContent = GAME_TITLES[state.gameType];

        if (state.gameType === 'cps') {
            cpsSection.style.display = '';
        } else if (state.gameType === 'reaction') {
            reactionSection.style.display = '';
            resetReaction();
        } else if (state.gameType === 'accuracy') {
            accuracySection.style.display = '';
            resetAccuracy();
        } else if (state.gameType === 'number') {
            numberSection.style.display = '';
            resetNumber();
        } else if (state.gameType === 'color') {
            colorSection.style.display = '';
            resetColorTest();
        }
    });
});

// ====== CPS LOGIC ======
function calculateCps() {
    const oneSecondAgo = Date.now() - 1000;
    state.clicks = state.clicks.filter(t => t > oneSecondAgo);
    return state.clicks.length;
}

function updateDisplay() {
    state.currentCps = calculateCps();
    currentCpsValue.textContent = state.currentCps;
    statCurrent.textContent = state.currentCps;
    statTotal.textContent = state.totalClicks;
    clickCount.textContent = `${state.totalClicks} tıklama`;
    if (state.currentCps > state.maxCps) {
        state.maxCps = state.currentCps;
        maxCpsValue.textContent = state.maxCps;
        statMax.textContent = state.maxCps;
        localStorage.setItem('maxCps', state.maxCps);
    }
    if (state.currentCps > state.bestStreak) {
        state.bestStreak = state.currentCps;
        statStreak.textContent = state.bestStreak;
        localStorage.setItem('bestStreak', state.bestStreak);
    }
    if (state.isRunning && state.timeLimit > 0) {
        const elapsed = (Date.now() - state.startTime) / 1000;
        const remaining = Math.max(0, state.timeLimit - elapsed);
        timerBar.style.width = (remaining / state.timeLimit * 100) + '%';
        timerText.textContent = `${remaining.toFixed(1)}sn kaldı`;
        if (remaining <= 2 && remaining > 0) timerBar.classList.add('timer-warning');
        else timerBar.classList.remove('timer-warning');
        if (remaining <= 0) { endGame(); return; }
    }
    state.animFrameId = requestAnimationFrame(updateDisplay);
}

function handleClick(e) {
    if (state.gameEnded || state.isCountdown) return;
    if (!state.isRunning) { startCountdown(); return; }
    state.clicks.push(Date.now());
    state.totalClicks++;
    clickButton.classList.add('pressing');
    setTimeout(() => clickButton.classList.remove('pressing'), 60);
    if (state.currentCps < 12) playClickSound();
    const cps = state.currentCps;
    if (!(cps > 80 && Math.random() > 0.1)) createRipple(e);
}

function startCountdown() {
    state.isCountdown = true;
    clickButton.classList.add('active-game');
    let count = 3;
    countdownOverlay.classList.add('show');
    countdownNumber.textContent = count;
    countdownNumber.classList.add('pop');
    playCountdownBeep();
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            countdownNumber.classList.remove('pop');
            void countdownNumber.offsetWidth;
            countdownNumber.classList.add('pop');
            playCountdownBeep();
        } else {
            clearInterval(interval);
            countdownNumber.textContent = 'BAŞLA!';
            countdownNumber.classList.remove('pop');
            void countdownNumber.offsetWidth;
            countdownNumber.classList.add('pop');
            playGoBeep();
            setTimeout(() => {
                countdownOverlay.classList.remove('show');
                state.isCountdown = false;
                startGame();
            }, 400);
        }
    }, 700);
}

function startGame() {
    state.isRunning = true; state.gameEnded = false;
    state.startTime = Date.now(); state.totalClicks = 0;
    state.clicks = []; state.currentStreak = 0;
    timerBar.style.width = '100%';
    timerBar.classList.remove('timer-warning');
    clickButton.classList.add('active-game');
    timerText.textContent = `${state.timeLimit}sn`;
    state.animFrameId = requestAnimationFrame(updateDisplay);
}

function endGame() {
    state.isRunning = false; state.gameEnded = true;
    cancelAnimationFrame(state.animFrameId);
    state.currentCps = calculateCps();
    currentCpsValue.textContent = state.currentCps;
    statCurrent.textContent = state.currentCps;
    timerBar.style.width = '0%';
    timerBar.classList.remove('timer-warning');
    timerText.textContent = `Bitti! Son CPS: ${state.currentCps}`;
    clickButton.classList.remove('active-game');
    clickButton.classList.add('game-ended');
    clickCount.textContent = 'Tekrar denemek için Sıfırla';
    playEndSound();
    state.lastSessionCps = state.currentCps;
    state.lastSessionMode = state.timeLimit;
    const name = playerNameInput.value.trim();
    if (name && state.currentCps > 0) {
        if (!state.registeredName) {
            state.registeredName = name;
            localStorage.setItem('registeredName', name);
            playerNameInput.readOnly = true;
            state.nameChangeUsed = true;
            localStorage.setItem('nameChangeUsed', 'true');
            changeNameBtn.style.display = 'none';
        }
        autoSubmitIfBest('cps', state.currentCps, state.timeLimit);
    }
}

// ====== UNIFIED AUTO SUBMIT ======
// Submits score to leaderboard ONLY if it's a new personal best.
// Type config: cps/accuracy higher=better, reaction/number lower=better.
const AUTO_SUBMIT_CONFIG = {
    cps:      { field: 'cps',   higherBetter: true,  matchType: (e) => !e.type || e.type === 'cps' },
    reaction: { field: 'time',  higherBetter: false, matchType: (e) => e.type === 'reaction' },
    accuracy: { field: 'score', higherBetter: true,  matchType: (e) => e.type === 'accuracy' },
    number:   { field: 'time',  higherBetter: false, matchType: (e) => e.type === 'number' },
    color:    { field: 'score', higherBetter: true,  matchType: (e) => e.type === 'color' },
};

async function autoSubmitIfBest(type, value, mode = null) {
    const name = playerNameInput.value.trim();
    if (!name || isInappropriateName(name)) return;
    if (!value || value <= 0) return;

    // Auto-register on first submission - check name uniqueness first
    if (!state.registeredName) {
        if (await isNameTaken(name)) {
            showNotification(`"${name}" ismi alınmış, başka bir isim seç!`, 'warning');
            return;
        }
        state.registeredName = name;
        localStorage.setItem('registeredName', name);
        playerNameInput.readOnly = true;
        if (!hasUnlimitedNameChange(name)) {
            state.nameChangeUsed = true;
            localStorage.setItem('nameChangeUsed', 'true');
        }
        if (changeNameBtn && !hasUnlimitedNameChange(name)) changeNameBtn.style.display = 'none';
        if (typeof updateChangelogVisibility === 'function') updateChangelogVisibility();
    }

    const cfg = AUTO_SUBMIT_CONFIG[type];
    if (!cfg) return;

    const prevData = await fetchLeaderboard();
    const lname = name.toLowerCase();
    const prevEntries = prevData.filter(e => cfg.matchType(e) && e.name.toLowerCase() === lname);
    const prevValues = prevEntries.map(e => e[cfg.field]).filter(v => typeof v === 'number');

    let isNewBest;
    if (prevValues.length === 0) isNewBest = true;
    else if (cfg.higherBetter) isNewBest = value > Math.max(...prevValues);
    else isNewBest = value < Math.min(...prevValues);

    if (!isNewBest) return; // Don't submit, don't notify

    const success = await submitScore(name, value, mode, type);
    if (!success) return;

    // Compute rank from updated leaderboard
    const data = state.leaderboardData || [];
    const filtered = data.filter(cfg.matchType);
    const bestPerPlayer = {};
    filtered.forEach(e => {
        const k = e.name.toLowerCase();
        const v = e[cfg.field];
        if (typeof v !== 'number') return;
        if (!bestPerPlayer[k] || (cfg.higherBetter ? v > bestPerPlayer[k][cfg.field] : v < bestPerPlayer[k][cfg.field])) {
            bestPerPlayer[k] = e;
        }
    });
    const sorted = Object.values(bestPerPlayer).sort((a, b) =>
        cfg.higherBetter ? b[cfg.field] - a[cfg.field] : a[cfg.field] - b[cfg.field]
    );
    const rank = sorted.findIndex(e => e.name.toLowerCase() === lname) + 1;
    if (rank > 0) showRankNotification(rank, type);

    // Refresh leaderboard view if open
    if (leaderboardOverlay.classList.contains('open') && state.leaderboardTab === type) {
        renderLeaderboard(data, type);
    }
}

function resetGame() {
    state.isRunning = false; state.gameEnded = false; state.isCountdown = false;
    state.clicks = []; state.totalClicks = 0;
    state.currentCps = 0; state.currentStreak = 0; state.startTime = null;
    cancelAnimationFrame(state.animFrameId);
    currentCpsValue.textContent = '0'; statCurrent.textContent = '0';
    statTotal.textContent = '0'; clickCount.textContent = '0 tıklama';
    timerBar.style.width = '100%';
    timerBar.classList.remove('timer-warning');
    timerText.textContent = 'Başlamak için tıkla!';
    clickButton.classList.remove('active-game', 'game-ended');
    countdownOverlay.classList.remove('show');
}

// ====== REACTION TEST ======
function resetReaction() {
    state.reactionState = 'idle'; state.reactionTimes = [];
    state.reactionRound = 0; clearTimeout(state.reactionTimer);
    reactionBox.className = 'reaction-idle';
    reactionText.textContent = 'Hazır mısın?';
    reactionSub.textContent = 'Kutucuğa tıkla';
    reactionResultValue.textContent = '—';
    statReactionBest.textContent = state.reactionBest ? state.reactionBest + 'ms' : '—';
    statReactionAvg.textContent = '—';
    statReactionRound.textContent = '0/5';
    statReactionWorst.textContent = '—';
    // Clear history bars
    reactionHistorySlots.forEach(slot => {
        slot.classList.remove('filled', 'fast', 'slow');
        slot.querySelector('.rh-value').textContent = '—';
    });
}

function handleReactionClick(e) {
    if (e && e.preventDefault) e.preventDefault();
    switch (state.reactionState) {
        case 'idle':
        case 'result':
            if (state.reactionRound >= state.reactionMaxRounds) resetReaction();
            state.reactionState = 'waiting';
            reactionBox.className = 'reaction-waiting';
            reactionText.textContent = 'Bekle...';
            reactionSub.textContent = 'Yeşil olduğunda tıkla!';
            const delay = 1000 + Math.random() * 3000;
            state.reactionTimer = setTimeout(() => {
                state.reactionState = 'ready';
                state.reactionStartTime = Date.now();
                reactionBox.className = 'reaction-ready';
                reactionText.textContent = 'ŞİMDİ!';
                reactionSub.textContent = 'Hemen tıkla!';
                playReactionGo();
            }, delay);
            break;
        case 'waiting':
            clearTimeout(state.reactionTimer);
            state.reactionState = 'result';
            reactionBox.className = 'reaction-early';
            reactionText.textContent = 'Çok erken!';
            reactionSub.textContent = 'Tekrar tıkla';
            playReactionEarly();
            break;
        case 'ready':
            const time = Date.now() - state.reactionStartTime;
            state.reactionTimes.push(time);
            state.reactionRound++;
            state.lastReactionTime = time;
            state.reactionState = 'result';
            reactionBox.className = 'reaction-result';
            reactionResultValue.textContent = time;
            let rating, color;
            if (time < 200) { rating = 'İnanılmaz! ⚡'; color = '#2ecc71'; }
            else if (time < 250) { rating = 'Çok hızlı! 🔥'; color = '#48dbfb'; }
            else if (time < 350) { rating = 'İyi! 👍'; color = '#feca57'; }
            else if (time < 500) { rating = 'Fena değil'; color = '#ff9ff3'; }
            else { rating = 'Yavaşlamışsın 🐢'; color = '#ff6b6b'; }
            reactionResultValue.style.color = color;
            reactionText.textContent = `${time}ms`;
            reactionSub.textContent = state.reactionRound >= state.reactionMaxRounds
                ? `${rating} — Bitti! Tekrar oyna` : `${rating} — Devam et`;
            const best = Math.min(...state.reactionTimes);
            const worst = Math.max(...state.reactionTimes);
            const avg = Math.round(state.reactionTimes.reduce((a, b) => a + b, 0) / state.reactionTimes.length);
            statReactionBest.textContent = best + 'ms';
            statReactionAvg.textContent = avg + 'ms';
            statReactionRound.textContent = `${state.reactionRound}/${state.reactionMaxRounds}`;
            statReactionWorst.textContent = worst + 'ms';

            // Update history bar
            const slot = reactionHistorySlots[state.reactionRound - 1];
            if (slot) {
                slot.classList.add('filled');
                if (time < 250) slot.classList.add('fast');
                else if (time > 400) slot.classList.add('slow');
                slot.querySelector('.rh-value').textContent = time;
            }
            if (best < state.reactionBest || state.reactionBest === 0) {
                state.reactionBest = best;
                localStorage.setItem('reactionBest', best);
            }
            if (state.reactionRound >= state.reactionMaxRounds) {
                const name = playerNameInput.value.trim();
                if (name) {
                    if (!state.registeredName) {
                        state.registeredName = name;
                        localStorage.setItem('registeredName', name);
                        playerNameInput.readOnly = true;
                        state.nameChangeUsed = true;
                        localStorage.setItem('nameChangeUsed', 'true');
                        changeNameBtn.style.display = 'none';
                    }
                    const bestTime = Math.min(...state.reactionTimes);
                    autoSubmitIfBest('reaction', bestTime);
                }
            }
            break;
    }
}

// ====== RIPPLE ======
const MAX_RIPPLES = 15;
function createRipple(e) {
    while (rippleContainer.children.length >= MAX_RIPPLES) rippleContainer.firstChild.remove();
    const rect = clickButton.getBoundingClientRect();
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = ((e.clientX || 0) - rect.left) + 'px';
    ripple.style.top = ((e.clientY || 0) - rect.top) + 'px';
    rippleContainer.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
}

// ====== NOTIFICATIONS ======
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-stack') || createNotificationStack();
    const notif = document.createElement('div');
    notif.className = `notif notif-${type}`;
    const icons = { rank: '🏆', success: '✓', warning: '⚠', info: 'ℹ' };
    notif.innerHTML = `<span class="notif-icon">${icons[type] || icons.info}</span><span class="notif-text">${message}</span><div class="notif-progress"></div>`;
    container.appendChild(notif);
    requestAnimationFrame(() => notif.classList.add('notif-show'));
    const progress = notif.querySelector('.notif-progress');
    progress.style.animationDuration = duration + 'ms';
    requestAnimationFrame(() => progress.classList.add('notif-progress-active'));
    setTimeout(() => {
        notif.classList.remove('notif-show');
        notif.classList.add('notif-hide');
        setTimeout(() => notif.remove(), 300);
    }, duration);
}

function createNotificationStack() {
    const c = document.createElement('div');
    c.id = 'notification-stack';
    document.body.appendChild(c);
    return c;
}

const TYPE_LABELS = { cps: 'CPS', reaction: 'Reaksiyon', accuracy: 'Doğruluk', number: 'Sayı', color: 'Renk' };

function showRankNotification(rank, type) {
    const label = TYPE_LABELS[type] || type;
    const rankText = rank === 1 ? '🥇 1.' : rank === 2 ? '🥈 2.' : rank === 3 ? '🥉 3.' : `${rank}.`;
    showNotification(`Yeni rekor! ${label} sıralamasında ${rankText} sıradasın!`, 'rank');
    if (rank <= 3) launchConfetti();
}

function launchConfetti() {
    let container = document.getElementById('confetti-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'confetti-container';
        document.body.appendChild(container);
    }
    const colors = ['#f0c040', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#48dbfb'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.5) + 's';
        piece.style.animationDuration = (1.8 + Math.random() * 1.2) + 's';
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(piece);
        setTimeout(() => piece.remove(), 3500);
    }
}

// ====== NAME MODAL ======
changeNameBtn.addEventListener('click', () => {
    if (state.registeredName) {
        nameModalText.innerHTML = `Mevcut isim: <b>${escapeHtml(state.registeredName)}</b><br>Değiştirmek istediğine emin misin? Bu isim <b>değiştirilemez</b>.`;
        nameModalInput.value = ''; nameModalInput.placeholder = 'Yeni isim...';
    } else {
        nameModalText.innerHTML = 'Bu isim <b>değiştirilemez</b>. Emin misin?';
        nameModalInput.value = playerNameInput.value; nameModalInput.placeholder = 'İsmini yaz...';
    }
    nameModal.classList.add('open'); nameModalInput.focus();
});

nameModalCancel.addEventListener('click', () => nameModal.classList.remove('open'));

nameModalConfirm.addEventListener('click', async () => {
    const newName = nameModalInput.value.trim();
    if (!newName) { nameModalInput.style.borderColor = '#ff6b6b'; setTimeout(() => nameModalInput.style.borderColor = '', 1500); return; }
    if (isInappropriateName(newName)) {
        nameModalInput.style.borderColor = '#e74c3c';
        nameModalText.innerHTML = 'Bu isim <b>uygunsuz</b>! Lütfen farklı bir isim seç.';
        nameModalInput.value = ''; nameModalInput.focus(); return;
    }
    if (await isNameTaken(newName)) {
        nameModalInput.style.borderColor = '#e74c3c';
        nameModalText.innerHTML = `<b>"${escapeHtml(newName)}"</b> ismi başka biri tarafından kullanılıyor! Farklı bir isim seç.`;
        nameModalInput.value = ''; nameModalInput.focus(); return;
    }
    const oldName = state.registeredName;
    playerNameInput.value = newName; localStorage.setItem('playerName', newName);
    state.registeredName = newName; localStorage.setItem('registeredName', newName);
    playerNameInput.readOnly = true;
    if (hasUnlimitedNameChange()) {
        changeNameBtn.style.display = '';
    } else {
        changeNameBtn.style.display = 'none';
        state.nameChangeUsed = true;
        localStorage.setItem('nameChangeUsed', 'true');
    }
    if (oldName && oldName.toLowerCase() !== newName.toLowerCase()) {
        const data = state.leaderboardData || await fetchLeaderboard();
        let changed = false;
        data.forEach(e => { if (e.name.toLowerCase() === oldName.toLowerCase()) { e.name = newName; changed = true; } });
        if (changed) {
            if (isJsonBinConfigured()) {
                try { await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY }, body: JSON.stringify({ scores: data }) }); } catch (err) { console.error('Rename error:', err); }
            } else { localStorage.setItem('leaderboard', JSON.stringify(data)); }
            state.leaderboardData = data;
        }
    }
    nameModal.classList.remove('open');
    // Restore cancel button after successful rename
    nameModalCancel.style.display = '';
    state.forceRename = false;
    updateChangelogVisibility();
});

nameModal.addEventListener('click', (e) => {
    if (e.target === nameModal && !state.forceRename) nameModal.classList.remove('open');
});
nameModalInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') nameModalConfirm.click(); });

// ====== MODE SELECTION ======
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.isCountdown || state.isRunning) return;
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeLimit = parseInt(btn.dataset.time);
        resetGame();
    });
});

// ====== CPS EVENTS ======
clickButton.addEventListener('mousedown', handleClick);
clickButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++)
        handleClick({ clientX: e.changedTouches[i].clientX, clientY: e.changedTouches[i].clientY });
}, { passive: false });
clickButton.addEventListener('contextmenu', e => e.preventDefault());

// ====== REACTION EVENTS ======
reactionBox.addEventListener('mousedown', handleReactionClick);
reactionBox.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleReactionClick(e);
}, { passive: false });
reactionBox.addEventListener('contextmenu', e => e.preventDefault());

// ====== ACCURACY GAME ======
function resetAccuracy() {
    clearInterval(state.accuracyTimer);
    state.accuracyState = 'idle';
    state.accuracyHits = 0;
    state.accuracyMisses = 0;
    accHits.textContent = '0';
    accMisses.textContent = '0';
    accTimer.textContent = state.accuracyDuration;
    accuracyTarget.style.display = 'none';
    accuracyZone.classList.remove('active');
    accuracyMessage.style.display = '';
    accuracyMessage.textContent = 'Başlamak için kutuya tıkla';
    statAccBest.textContent = state.accuracyBest ? state.accuracyBest : '—';
    statAccPct.textContent = '—';
}

function startAccuracy() {
    state.accuracyState = 'running';
    state.accuracyHits = 0;
    state.accuracyMisses = 0;
    accHits.textContent = '0';
    accMisses.textContent = '0';
    accuracyZone.classList.add('active');
    accuracyMessage.style.display = 'none';
    state.accuracyEndTime = Date.now() + state.accuracyDuration * 1000;
    accTimer.textContent = state.accuracyDuration;
    spawnAccuracyTarget();
    state.accuracyTimer = setInterval(() => {
        const remain = Math.max(0, Math.ceil((state.accuracyEndTime - Date.now()) / 1000));
        accTimer.textContent = remain;
        if (remain <= 0) endAccuracy();
    }, 100);
}

function spawnAccuracyTarget() {
    const rect = accuracyZone.getBoundingClientRect();
    const size = 56;
    const margin = size / 2 + 8;
    const x = margin + Math.random() * (rect.width - margin * 2);
    const y = margin + Math.random() * (rect.height - margin * 2);
    accuracyTarget.style.left = x + 'px';
    accuracyTarget.style.top = y + 'px';
    accuracyTarget.style.display = 'block';
    // Restart pop animation
    accuracyTarget.style.animation = 'none';
    void accuracyTarget.offsetWidth;
    accuracyTarget.style.animation = '';
}

function endAccuracy() {
    clearInterval(state.accuracyTimer);
    state.accuracyState = 'ended';
    accuracyTarget.style.display = 'none';
    accuracyZone.classList.remove('active');
    accuracyMessage.style.display = '';
    accuracyMessage.textContent = `Bitti! ${state.accuracyHits} vuruş — Tekrar için tıkla`;
    const total = state.accuracyHits + state.accuracyMisses;
    const pct = total > 0 ? Math.round((state.accuracyHits / total) * 100) : 0;
    statAccPct.textContent = pct + '%';
    state.lastAccuracyScore = state.accuracyHits;
    state.lastAccuracyAccuracy = pct;
    if (state.accuracyHits > state.accuracyBest) {
        state.accuracyBest = state.accuracyHits;
        localStorage.setItem('accuracyBest', state.accuracyHits);
        statAccBest.textContent = state.accuracyHits;
    }
    playEndSound();
    // Auto-submit only if new personal best
    autoSubmitIfBest('accuracy', state.accuracyHits);
}

function handleAccuracyClick(e) {
    if (state.accuracyState === 'idle' || state.accuracyState === 'ended') {
        startAccuracy();
        return;
    }
    if (state.accuracyState !== 'running') return;
    // Determine if click was on target
    const targetRect = accuracyTarget.getBoundingClientRect();
    const cx = e.clientX, cy = e.clientY;
    const tcx = targetRect.left + targetRect.width / 2;
    const tcy = targetRect.top + targetRect.height / 2;
    const dist = Math.hypot(cx - tcx, cy - tcy);
    if (dist <= targetRect.width / 2 && accuracyTarget.style.display !== 'none') {
        state.accuracyHits++;
        accHits.textContent = state.accuracyHits;
        spawnAccuracyTarget();
    } else {
        state.accuracyMisses++;
        accMisses.textContent = state.accuracyMisses;
    }
}

accuracyZone.addEventListener('mousedown', handleAccuracyClick);
accuracyZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    handleAccuracyClick({ clientX: t.clientX, clientY: t.clientY });
}, { passive: false });
accuracyZone.addEventListener('contextmenu', e => e.preventDefault());

// ====== NUMBER GAME ======
function resetNumber() {
    clearInterval(state.numberTimerInterval);
    state.numberState = 'idle';
    state.numberNext = 1;
    numNext.textContent = '1';
    numTimer.textContent = '0.00';
    numberStartBtn.disabled = false;
    numberStartBtn.textContent = 'Başla';
    statNumBest.textContent = state.numberBest ? (state.numberBest / 1000).toFixed(2) + 's' : '—';
    statNumLast.textContent = state.lastNumberTime ? (state.lastNumberTime / 1000).toFixed(2) + 's' : '—';
    // Render shuffled grid (gray, disabled)
    renderNumberGrid(true);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function renderNumberGrid(disabled) {
    state.numberOrder = shuffleArray(Array.from({ length: 25 }, (_, i) => i + 1));
    numberGrid.innerHTML = state.numberOrder.map(n =>
        `<div class="num-cell ${disabled ? 'disabled' : ''}" data-num="${n}">${n}</div>`
    ).join('');
    numberGrid.querySelectorAll('.num-cell').forEach(cell => {
        cell.addEventListener('click', () => handleNumberClick(parseInt(cell.dataset.num), cell));
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleNumberClick(parseInt(cell.dataset.num), cell);
        }, { passive: false });
    });
}

function startNumberGame() {
    state.numberState = 'running';
    state.numberNext = 1;
    numNext.textContent = '1';
    state.numberStartTime = Date.now();
    numberStartBtn.disabled = true;
    numberStartBtn.textContent = 'Çalışıyor...';
    renderNumberGrid(false);
    state.numberTimerInterval = setInterval(() => {
        const elapsed = (Date.now() - state.numberStartTime) / 1000;
        numTimer.textContent = elapsed.toFixed(2);
    }, 50);
}

function handleNumberClick(n, cell) {
    if (state.numberState !== 'running') return;
    if (n === state.numberNext) {
        cell.classList.add('correct', 'disabled');
        state.numberNext++;
        if (state.numberNext > 25) {
            endNumberGame();
        } else {
            numNext.textContent = state.numberNext;
        }
    } else {
        cell.classList.remove('wrong');
        void cell.offsetWidth;
        cell.classList.add('wrong');
        setTimeout(() => cell.classList.remove('wrong'), 300);
    }
}

function endNumberGame() {
    clearInterval(state.numberTimerInterval);
    state.numberState = 'ended';
    const elapsed = Date.now() - state.numberStartTime;
    state.lastNumberTime = elapsed;
    numTimer.textContent = (elapsed / 1000).toFixed(2);
    numberStartBtn.disabled = false;
    numberStartBtn.textContent = 'Tekrar Oyna';
    statNumLast.textContent = (elapsed / 1000).toFixed(2) + 's';
    if (!state.numberBest || elapsed < state.numberBest) {
        state.numberBest = elapsed;
        localStorage.setItem('numberBest', elapsed);
        statNumBest.textContent = (elapsed / 1000).toFixed(2) + 's';
    }
    playEndSound();
    autoSubmitIfBest('number', elapsed);
}

numberStartBtn.addEventListener('click', () => {
    if (state.numberState === 'running') return;
    startNumberGame();
});

// ====== COLOR TEST ======
const COLOR_MAP = {
    red:    { name: 'Kırmızı', hex: '#e74c3c' },
    blue:   { name: 'Mavi',    hex: '#3498db' },
    green:  { name: 'Yeşil',   hex: '#2ecc71' },
    yellow: { name: 'Sarı',    hex: '#f0c040' },
    purple: { name: 'Mor',     hex: '#9b59b6' },
    orange: { name: 'Turuncu', hex: '#e67e22' },
};
const COLOR_KEYS = Object.keys(COLOR_MAP);

function resetColorTest() {
    clearInterval(state.colorTimer);
    state.colorState = 'idle';
    state.colorCorrect = 0;
    state.colorWrong = 0;
    colorCorrectEl.textContent = '0';
    colorWrongEl.textContent = '0';
    colorTimerVal.textContent = state.colorDuration;
    colorDisplayText.textContent = 'Başlamak için tıkla';
    colorDisplayText.style.color = '#7a8a9a';
    statColorBest.textContent = state.colorBest || '—';
    statColorPct.textContent = '—';
}

function startColorTest() {
    state.colorState = 'running';
    state.colorCorrect = 0;
    state.colorWrong = 0;
    colorCorrectEl.textContent = '0';
    colorWrongEl.textContent = '0';
    state.colorEndTime = Date.now() + state.colorDuration * 1000;
    colorTimerVal.textContent = state.colorDuration;
    nextColorChallenge();
    state.colorTimer = setInterval(() => {
        const remain = Math.max(0, Math.ceil((state.colorEndTime - Date.now()) / 1000));
        colorTimerVal.textContent = remain;
        if (remain <= 0) endColorTest();
    }, 100);
}

function nextColorChallenge() {
    // Pick a word and a different display color (Stroop)
    const wordKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    let colorKey;
    do { colorKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]; }
    while (Math.random() > 0.3 && colorKey === wordKey); // 70% chance they differ
    state.colorTargetColor = colorKey;
    state.colorTargetWord = wordKey;
    colorDisplayText.textContent = COLOR_MAP[wordKey].name.toUpperCase();
    colorDisplayText.style.color = COLOR_MAP[colorKey].hex;
}

function endColorTest() {
    clearInterval(state.colorTimer);
    state.colorState = 'ended';
    colorDisplayText.textContent = `Bitti! ${state.colorCorrect} doğru`;
    colorDisplayText.style.color = '#2ecc71';
    const total = state.colorCorrect + state.colorWrong;
    const pct = total > 0 ? Math.round((state.colorCorrect / total) * 100) : 0;
    statColorPct.textContent = pct + '%';
    state.lastColorScore = state.colorCorrect;
    if (state.colorCorrect > state.colorBest) {
        state.colorBest = state.colorCorrect;
        localStorage.setItem('colorBest', state.colorCorrect);
        statColorBest.textContent = state.colorCorrect;
    }
    playEndSound();
    autoSubmitIfBest('color', state.colorCorrect);
}

function handleColorClick(pickedKey, btn) {
    if (state.colorState === 'idle' || state.colorState === 'ended') {
        startColorTest();
        return;
    }
    if (state.colorState !== 'running') return;
    if (pickedKey === state.colorTargetColor) {
        state.colorCorrect++;
        colorCorrectEl.textContent = state.colorCorrect;
        btn.classList.remove('flash-correct');
        void btn.offsetWidth;
        btn.classList.add('flash-correct');
        nextColorChallenge();
    } else {
        state.colorWrong++;
        colorWrongEl.textContent = state.colorWrong;
        btn.classList.remove('flash-wrong');
        void btn.offsetWidth;
        btn.classList.add('flash-wrong');
    }
}

colorDisplayZone.addEventListener('click', () => {
    if (state.colorState === 'idle' || state.colorState === 'ended') startColorTest();
});

colorButtons.forEach(btn => {
    btn.addEventListener('click', () => handleColorClick(btn.dataset.color, btn));
});

// ====== THEME ======
function applyTheme(theme) {
    document.body.dataset.theme = theme;
    state.theme = theme;
    localStorage.setItem('theme', theme);
    themeOptions.forEach(o => o.classList.toggle('active', o.dataset.theme === theme));
}

function initTheme() {
    applyTheme(state.theme);
    if (!themeBtn) return;
    themeBtn.addEventListener('click', () => themeModal.classList.add('open'));
    themeClose.addEventListener('click', () => themeModal.classList.remove('open'));
    themeModal.addEventListener('click', (e) => { if (e.target === themeModal) themeModal.classList.remove('open'); });
    themeOptions.forEach(o => o.addEventListener('click', () => {
        applyTheme(o.dataset.theme);
        setTimeout(() => themeModal.classList.remove('open'), 150);
    }));
}

// ====== AVATAR ======
const AVATAR_OPTIONS = ['😎','😺','🦊','🦁','🐺','🐉','🐸','🐼','🦄','🐯','🐻','🐧','🦅','🦉','🐢','🐙','🦋','🌟','⚡','🔥','💎','👑','🎯','🚀','🎮','🤖','👻','💀','🧠','🎩'];

function isAvatarUrl(av) {
    return typeof av === 'string' && /^https?:\/\//.test(av);
}

function avatarHtml(av, cls = 'lb-avatar') {
    if (!av) return '';
    if (isAvatarUrl(av)) return `<img src="${av}" class="${cls}-img" alt="" referrerpolicy="no-referrer">`;
    return `<span class="${cls}">${av}</span>`;
}

function setAvatarButton(av) {
    if (!avatarBtn) return;
    if (isAvatarUrl(av)) {
        avatarBtn.innerHTML = `<img src="${av}" alt="" referrerpolicy="no-referrer">`;
    } else {
        avatarBtn.textContent = av;
    }
}

function setAvatar(av) {
    state.avatar = av;
    localStorage.setItem('avatar', av);
    setAvatarButton(av);
    if (state.registeredName) syncAvatarToLeaderboard();
}

function renderAvatarGrid() {
    avatarGrid.innerHTML = AVATAR_OPTIONS.map(emoji =>
        `<button class="avatar-option ${emoji === state.avatar ? 'selected' : ''}" data-avatar="${emoji}">${emoji}</button>`
    ).join('');
    avatarGrid.querySelectorAll('.avatar-option').forEach(opt => {
        opt.addEventListener('click', () => {
            setAvatar(opt.dataset.avatar);
            renderAvatarGrid();
            setTimeout(() => avatarModal.classList.remove('open'), 150);
        });
    });
}

// Resize an image file to a max dimension and return base64 (without data: prefix).
function resizeImageFile(file, maxSize = 128) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
                const w = Math.round(img.width * ratio);
                const h = Math.round(img.height * ratio);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl.split(',')[1]);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function uploadAvatarToImgBB(file, statusEl) {
    statusEl.className = '';
    statusEl.textContent = 'Resim hazırlanıyor...';
    let base64;
    try {
        base64 = await resizeImageFile(file, 128);
    } catch (err) {
        statusEl.className = 'error'; statusEl.textContent = 'Resim okunamadı';
        return null;
    }
    statusEl.textContent = 'Yükleniyor...';
    try {
        const formData = new FormData();
        formData.append('image', base64);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            statusEl.className = 'error';
            statusEl.textContent = json.error?.message || 'Yükleme başarısız';
            return null;
        }
        statusEl.className = 'success';
        statusEl.textContent = '✓ Yüklendi!';
        return json.data.display_url || json.data.url;
    } catch (err) {
        statusEl.className = 'error';
        statusEl.textContent = 'Bağlantı hatası';
        return null;
    }
}

async function syncAvatarToLeaderboard() {
    // Always fetch fresh data to avoid overwriting recent submissions from other players
    const data = await fetchLeaderboard(true);
    const lname = state.registeredName.toLowerCase();
    let changed = false;
    data.forEach(e => {
        if (e.name && e.name.toLowerCase() === lname && e.avatar !== state.avatar) {
            e.avatar = state.avatar;
            changed = true;
        }
    });
    if (!changed) return;
    if (isJsonBinConfigured()) {
        try {
            await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY },
                body: JSON.stringify({ scores: data })
            });
        } catch (err) { console.error('Avatar sync error:', err); }
    } else {
        localStorage.setItem('leaderboard', JSON.stringify(data));
    }
    state.leaderboardData = data;
    if (leaderboardOverlay.classList.contains('open')) renderLeaderboard(data, state.leaderboardTab);
}

function initAvatar() {
    setAvatarButton(state.avatar);
    avatarBtn.addEventListener('click', () => {
        renderAvatarGrid();
        avatarModal.classList.add('open');
    });
    avatarClose.addEventListener('click', () => avatarModal.classList.remove('open'));
    avatarModal.addEventListener('click', (e) => { if (e.target === avatarModal) avatarModal.classList.remove('open'); });

    const uploadBtn = document.getElementById('avatar-upload-btn');
    const fileInput = document.getElementById('avatar-file-input');
    if (!uploadBtn) return;

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
            const statusEl = document.getElementById('avatar-upload-status');
            statusEl.className = 'error'; statusEl.textContent = 'Dosya çok büyük (max 8MB)';
            fileInput.value = '';
            return;
        }
        openCropModal(file);
        fileInput.value = '';
    });

    initCropModal();
}

// ====== PROFILE MODAL ======
const PROFILE_TYPES = [
    { type: 'cps',      icon: '⚡', label: 'CPS',      field: 'cps',   higherBetter: true,
      fmt: (e) => `${(e.cps || 0).toFixed(2)} CPS` },
    { type: 'reaction', icon: '🎯', label: 'Reaksiyon', field: 'time',  higherBetter: false,
      fmt: (e) => `${Math.round(e.time)} ms` },
    { type: 'accuracy', icon: '🎯', label: 'Doğruluk',  field: 'score', higherBetter: true,
      fmt: (e) => `${e.score} vuruş` },
    { type: 'number',   icon: '🔢', label: 'Sayı',      field: 'time',  higherBetter: false,
      fmt: (e) => `${(e.time / 1000).toFixed(2)} sn` },
    { type: 'color',    icon: '🌈', label: 'Renk',      field: 'score', higherBetter: true,
      fmt: (e) => `${e.score} doğru` },
];

function getBestPerPlayer(entries, field, higherBetter) {
    const best = {};
    entries.forEach(e => {
        const k = (e.name || '').toLowerCase();
        if (!k) return;
        const v = e[field];
        if (typeof v !== 'number') return;
        if (!best[k] || (higherBetter ? v > best[k][field] : v < best[k][field])) best[k] = e;
    });
    return Object.values(best);
}

function matchesType(e, type) {
    if (type === 'cps') return !e.type || e.type === 'cps';
    return e.type === type;
}

async function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const sinceEl = document.getElementById('profile-since');
    const statsEl = document.getElementById('profile-stats-grid');
    const recordsEl = document.getElementById('profile-records-list');

    const setProfileAvatar = (av) => {
        if (isAvatarUrl(av)) avatarEl.innerHTML = `<img src="${av}" alt="" referrerpolicy="no-referrer">`;
        else { avatarEl.innerHTML = ''; avatarEl.textContent = av || '👤'; }
    };

    const myName = (state.registeredName || playerNameInput.value.trim() || '').trim();
    if (!myName) {
        nameEl.textContent = 'İsim yok';
        sinceEl.textContent = 'Önce isim belirle';
        statsEl.innerHTML = '';
        recordsEl.innerHTML = '<div style="color:#7a8a9a;text-align:center;padding:12px">Profilini görmek için önce isim belirle</div>';
        setProfileAvatar(state.avatar);
        modal.classList.add('open');
        return;
    }

    // Show shell + loading
    if (isAvatarUrl(state.avatar)) avatarEl.innerHTML = `<img src="${state.avatar}" alt="" referrerpolicy="no-referrer">`;
    else avatarEl.textContent = state.avatar || '👤';
    nameEl.textContent = myName;
    sinceEl.textContent = 'Yükleniyor...';
    statsEl.innerHTML = '';
    recordsEl.innerHTML = '<div style="color:#7a8a9a;text-align:center;padding:12px">Yükleniyor...</div>';
    modal.classList.add('open');

    const data = await fetchLeaderboard();
    const lname = myName.toLowerCase();
    const myEntries = data.filter(e => e.name && e.name.toLowerCase() === lname);

    // Earliest date
    let earliest = null;
    myEntries.forEach(e => {
        if (e.date) {
            const d = new Date(e.date);
            if (!earliest || d < earliest) earliest = d;
        }
    });
    sinceEl.textContent = earliest
        ? `Üye: ${earliest.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
        : 'Yeni üye';

    // Stats: total records, top-3 count, average rank
    let totalRecords = 0;
    let topThreeCount = 0;
    let bestRank = null;
    const records = [];

    PROFILE_TYPES.forEach(({ type, icon, label, field, higherBetter, fmt }) => {
        const typeEntries = data.filter(e => matchesType(e, type) && typeof e[field] === 'number');
        const bestPlayers = getBestPerPlayer(typeEntries, field, higherBetter);
        bestPlayers.sort((a, b) => higherBetter ? b[field] - a[field] : a[field] - b[field]);
        const myRank = bestPlayers.findIndex(e => e.name.toLowerCase() === lname) + 1;
        const myEntry = bestPlayers.find(e => e.name.toLowerCase() === lname);

        if (myEntry) {
            totalRecords++;
            if (myRank <= 3) topThreeCount++;
            if (bestRank === null || myRank < bestRank) bestRank = myRank;
        }

        records.push({ icon, label, myEntry, myRank, totalPlayers: bestPlayers.length, fmt });
    });

    // Render stats
    statsEl.innerHTML = `
        <div class="profile-stat"><span class="profile-stat-label">Rekorlar</span><span class="profile-stat-value">${totalRecords}/${PROFILE_TYPES.length}</span></div>
        <div class="profile-stat"><span class="profile-stat-label">İlk 3</span><span class="profile-stat-value">${topThreeCount}</span></div>
        <div class="profile-stat"><span class="profile-stat-label">En İyi Sıra</span><span class="profile-stat-value">${bestRank ? '#' + bestRank : '—'}</span></div>
        <div class="profile-stat"><span class="profile-stat-label">Toplam Skor</span><span class="profile-stat-value">${myEntries.length}</span></div>
    `;

    // Render records
    recordsEl.innerHTML = records.map(r => {
        if (!r.myEntry) {
            return `<div class="profile-record">
                <span class="profile-record-icon">${r.icon}</span>
                <span class="profile-record-name">${r.label}</span>
                <span class="profile-record-score empty">Henüz yok</span>
                <span class="profile-record-rank empty">—</span>
            </div>`;
        }
        const rankClass = r.myRank === 1 ? 'top1' : r.myRank <= 3 ? 'top3' : '';
        const rankText = `#${r.myRank}`;
        return `<div class="profile-record">
            <span class="profile-record-icon">${r.icon}</span>
            <span class="profile-record-name">${r.label}</span>
            <span class="profile-record-score">${r.fmt(r.myEntry)}</span>
            <span class="profile-record-rank ${rankClass}">${rankText}</span>
        </div>`;
    }).join('');
}

function initProfile() {
    const btn = document.getElementById('profile-btn');
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('profile-close');
    if (!btn) return;
    btn.addEventListener('click', openProfileModal);
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
}

// ====== AVATAR CROP ======
const CROP_VIEWPORT = 260; // matches CSS
const CROP_OUTPUT = 256;

const cropState = {
    image: null,       // HTMLImageElement
    baseScale: 1,      // scale to cover viewport
    zoom: 1,           // user zoom multiplier
    tx: 0, ty: 0,      // image offset
    dragging: false,
    startX: 0, startY: 0,
    startTx: 0, startTy: 0,
};

function openCropModal(file) {
    const modal = document.getElementById('crop-modal');
    const imgEl = document.getElementById('crop-image');
    const status = document.getElementById('crop-status');

    // Open modal IMMEDIATELY with loading state so user sees something
    modal.classList.add('open');
    cropState.image = null;
    imgEl.removeAttribute('src');
    imgEl.style.transform = 'translate(0, 0) scale(1)';
    imgEl.style.width = '0px';
    imgEl.style.height = '0px';
    status.className = '';
    status.textContent = 'Resim yükleniyor...';

    if (!file.type.startsWith('image/')) {
        status.className = 'error';
        status.textContent = 'Geçersiz dosya formatı';
        return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
        status.className = 'error';
        status.textContent = 'Dosya okunamadı';
    };
    reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => {
            status.className = 'error';
            status.textContent = 'Bu resim formatı desteklenmiyor (HEIC olabilir — JPG/PNG kullan)';
        };
        img.onload = () => {
            cropState.image = img;
            imgEl.src = e.target.result;
            imgEl.style.width = img.naturalWidth + 'px';
            imgEl.style.height = img.naturalHeight + 'px';
            cropState.baseScale = Math.max(CROP_VIEWPORT / img.naturalWidth, CROP_VIEWPORT / img.naturalHeight);
            cropState.zoom = 1;
            const eff = cropState.baseScale * cropState.zoom;
            cropState.tx = (CROP_VIEWPORT - img.naturalWidth * eff) / 2;
            cropState.ty = (CROP_VIEWPORT - img.naturalHeight * eff) / 2;
            document.getElementById('crop-zoom').value = '1';
            applyCropTransform();
            status.textContent = '';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function applyCropTransform() {
    const imgEl = document.getElementById('crop-image');
    const eff = cropState.baseScale * cropState.zoom;
    // Clamp so image always covers viewport
    const minTx = CROP_VIEWPORT - cropState.image.naturalWidth * eff;
    const minTy = CROP_VIEWPORT - cropState.image.naturalHeight * eff;
    cropState.tx = Math.min(0, Math.max(minTx, cropState.tx));
    cropState.ty = Math.min(0, Math.max(minTy, cropState.ty));
    imgEl.style.transform = `translate(${cropState.tx}px, ${cropState.ty}px) scale(${eff})`;
}

function initCropModal() {
    const modal = document.getElementById('crop-modal');
    const viewport = document.getElementById('crop-viewport');
    const zoomSlider = document.getElementById('crop-zoom');
    const cancelBtn = document.getElementById('crop-cancel');
    const applyBtn = document.getElementById('crop-apply');
    const status = document.getElementById('crop-status');

    cancelBtn.addEventListener('click', () => modal.classList.remove('open'));

    zoomSlider.addEventListener('input', () => {
        if (!cropState.image) return;
        const oldEff = cropState.baseScale * cropState.zoom;
        cropState.zoom = parseFloat(zoomSlider.value);
        const newEff = cropState.baseScale * cropState.zoom;
        // Zoom around viewport center
        const cx = CROP_VIEWPORT / 2, cy = CROP_VIEWPORT / 2;
        cropState.tx = cx - (cx - cropState.tx) * (newEff / oldEff);
        cropState.ty = cy - (cy - cropState.ty) * (newEff / oldEff);
        applyCropTransform();
    });

    // Pointer drag
    viewport.addEventListener('pointerdown', (e) => {
        if (!cropState.image) return;
        cropState.dragging = true;
        cropState.startX = e.clientX;
        cropState.startY = e.clientY;
        cropState.startTx = cropState.tx;
        cropState.startTy = cropState.ty;
        viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
        if (!cropState.dragging) return;
        cropState.tx = cropState.startTx + (e.clientX - cropState.startX);
        cropState.ty = cropState.startTy + (e.clientY - cropState.startY);
        applyCropTransform();
    });
    viewport.addEventListener('pointerup', () => { cropState.dragging = false; });
    viewport.addEventListener('pointercancel', () => { cropState.dragging = false; });

    applyBtn.addEventListener('click', async () => {
        if (!cropState.image) return;
        applyBtn.disabled = true;
        status.className = ''; status.textContent = 'Yükleniyor...';
        try {
            const eff = cropState.baseScale * cropState.zoom;
            const sx = -cropState.tx / eff;
            const sy = -cropState.ty / eff;
            const sw = CROP_VIEWPORT / eff;
            const sh = CROP_VIEWPORT / eff;
            const canvas = document.createElement('canvas');
            canvas.width = CROP_OUTPUT; canvas.height = CROP_OUTPUT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, CROP_OUTPUT, CROP_OUTPUT);
            ctx.drawImage(cropState.image, sx, sy, sw, sh, 0, 0, CROP_OUTPUT, CROP_OUTPUT);
            const base64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];

            const formData = new FormData();
            formData.append('image', base64);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: 'POST', body: formData,
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error?.message || 'Yükleme hatası');
            const url = json.data.display_url || json.data.url;
            status.className = 'success'; status.textContent = '✓ Yüklendi!';
            setAvatar(url);
            renderAvatarGrid();
            setTimeout(() => {
                modal.classList.remove('open');
                avatarModal.classList.remove('open');
                status.textContent = '';
            }, 700);
        } catch (err) {
            status.className = 'error';
            status.textContent = err.message || 'Yükleme başarısız';
        }
        applyBtn.disabled = false;
    });
}

// ====== PREVENT ZOOM ======
document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

// ====== KEYBOARD ======
function resetCurrentGame() {
    if (state.gameType === 'cps') resetGame();
    else if (state.gameType === 'reaction') resetReaction();
    else if (state.gameType === 'accuracy') resetAccuracy();
    else if (state.gameType === 'number') resetNumber();
    else if (state.gameType === 'color') resetColorTest();
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.gameType === 'cps') {
            if (state.gameEnded) resetGame(); else handleClick({ clientX: 0, clientY: 0 });
        } else if (state.gameType === 'reaction') {
            handleReactionClick(e);
        } else if (state.gameType === 'number' && state.numberState !== 'running') {
            startNumberGame();
        }
    }
    if (e.code === 'KeyR') { e.preventDefault(); resetCurrentGame(); }
});

// ====== RESET BUTTON ======
resetBtn.addEventListener('click', resetCurrentGame);

// ====== LEADERBOARD ======
function isJsonBinConfigured() {
    return JSONBIN_CONFIG.API_KEY !== 'BURAYA_API_KEY_YAPISTIR' && JSONBIN_CONFIG.BIN_ID !== 'BURAYA_BIN_ID_YAPISTIR';
}

let lbCacheTime = 0;
const LB_CACHE_TTL = 30000;

async function fetchLeaderboard(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && state.leaderboardData && (now - lbCacheTime) < LB_CACHE_TTL) return state.leaderboardData;
    if (!isJsonBinConfigured()) return getLocalLeaderboard();
    try {
        const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}/latest`, { headers: { 'X-Master-Key': JSONBIN_CONFIG.API_KEY } });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        state.leaderboardData = data.record.scores || [];
        lbCacheTime = now;
        localStorage.setItem('leaderboardCache', JSON.stringify(state.leaderboardData));
        return state.leaderboardData;
    } catch (err) { console.error('Leaderboard fetch error:', err); return getLocalLeaderboard(); }
}

function getLocalLeaderboard() {
    const cached = localStorage.getItem('leaderboardCache');
    if (cached) { state.leaderboardData = JSON.parse(cached); return state.leaderboardData; }
    const data = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    state.leaderboardData = data; return data;
}

async function submitScore(name, value, mode, type) {
    // Block inappropriate names from being submitted
    if (isInappropriateName(name)) {
        forceInappropriateRename();
        return false;
    }
    const entry = { name, type, date: new Date().toISOString() };
    if (state.avatar) entry.avatar = state.avatar;
    if (type === 'cps') { entry.cps = value; entry.mode = mode; }
    else if (type === 'accuracy' || type === 'color') { entry.score = value; }
    else { entry.time = value; }  // reaction & number
    if (!isJsonBinConfigured()) {
        const data = getLocalLeaderboard();
        upsertScore(data, entry, type);
        localStorage.setItem('leaderboard', JSON.stringify(data));
        state.leaderboardData = data; return true;
    }
    try {
        const current = await fetchLeaderboard();
        upsertScore(current, entry, type);
        const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY },
            body: JSON.stringify({ scores: current })
        });
        if (!res.ok) throw new Error('Submit error');
        state.leaderboardData = current; lbCacheTime = 0; return true;
    } catch (err) {
        console.error('Submit error:', err);
        const data = getLocalLeaderboard();
        upsertScore(data, entry, type);
        localStorage.setItem('leaderboard', JSON.stringify(data));
        state.leaderboardData = data; return true;
    }
}

function upsertScore(data, entry, type) {
    const lname = entry.name.toLowerCase();
    if (type === 'cps') {
        const idx = data.findIndex(e => e.type === 'cps' && e.name.toLowerCase() === lname && e.mode == entry.mode);
        if (idx >= 0) { if (entry.cps > data[idx].cps) { data[idx].cps = entry.cps; data[idx].date = entry.date; } }
        else data.push(entry);
    } else if (type === 'reaction') {
        const idx = data.findIndex(e => e.type === 'reaction' && e.name.toLowerCase() === lname);
        if (idx >= 0) { if (entry.time < data[idx].time) { data[idx].time = entry.time; data[idx].date = entry.date; } }
        else data.push(entry);
    } else if (type === 'accuracy') {
        const idx = data.findIndex(e => e.type === 'accuracy' && e.name.toLowerCase() === lname);
        if (idx >= 0) { if ((entry.score || 0) > (data[idx].score || 0)) { data[idx].score = entry.score; data[idx].date = entry.date; } }
        else data.push(entry);
    } else if (type === 'number') {
        const idx = data.findIndex(e => e.type === 'number' && e.name.toLowerCase() === lname);
        if (idx >= 0) { if (entry.time < data[idx].time) { data[idx].time = entry.time; data[idx].date = entry.date; } }
        else data.push(entry);
    } else if (type === 'color') {
        const idx = data.findIndex(e => e.type === 'color' && e.name.toLowerCase() === lname);
        if (idx >= 0) { if ((entry.score || 0) > (data[idx].score || 0)) { data[idx].score = entry.score; data[idx].date = entry.date; } }
        else data.push(entry);
    }
    // Sync avatar on existing entries
    if (entry.avatar) {
        data.forEach(e => { if (e.name.toLowerCase() === lname) e.avatar = entry.avatar; });
    }
}

function renderLeaderboard(data, tabType) {
    const playerName = playerNameInput.value.trim().toLowerCase();
    data = data.filter(e => !isInappropriateName(e.name));

    let entries = [];
    let scoreLabel = '';
    let scoreFormat = (e) => '';

    if (tabType === 'cps') {
        // Legacy entries (no type) treated as cps
        const cpsEntries = data.filter(e => !e.type || e.type === 'cps');
        const bestPerPlayer = {};
        cpsEntries.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || (e.cps || 0) > (bestPerPlayer[key].cps || 0)) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => (b.cps || 0) - (a.cps || 0));
        scoreLabel = 'CPS';
        scoreFormat = (e) => `${e.cps} <span>CPS</span>`;
    } else if (tabType === 'reaction') {
        const r = data.filter(e => e.type === 'reaction' && typeof e.time === 'number');
        const bestPerPlayer = {};
        r.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.time < bestPerPlayer[key].time) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => a.time - b.time);
        scoreFormat = (e) => `${e.time} <span>ms</span>`;
    } else if (tabType === 'accuracy') {
        const a = data.filter(e => e.type === 'accuracy' && typeof e.score === 'number');
        const bestPerPlayer = {};
        a.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.score > bestPerPlayer[key].score) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => b.score - a.score);
        scoreFormat = (e) => `${e.score} <span>vuruş</span>`;
    } else if (tabType === 'number') {
        const n = data.filter(e => e.type === 'number' && typeof e.time === 'number');
        const bestPerPlayer = {};
        n.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.time < bestPerPlayer[key].time) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => a.time - b.time);
        scoreFormat = (e) => `${(e.time / 1000).toFixed(2)} <span>sn</span>`;
    } else if (tabType === 'color') {
        const c = data.filter(e => e.type === 'color' && typeof e.score === 'number');
        const bestPerPlayer = {};
        c.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.score > bestPerPlayer[key].score) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => b.score - a.score);
        scoreFormat = (e) => `${e.score} <span>doğru</span>`;
    }

    if (entries.length === 0) { leaderboardList.innerHTML = '<div class="lb-empty">Henüz skor yok! 🎮</div>'; return; }
    leaderboardList.innerHTML = entries.map((entry, i) => {
        const rank = i + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const isSelf = entry.name.toLowerCase() === playerName;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        const avatar = avatarHtml(entry.avatar, 'lb-avatar');
        return `<div class="lb-row ${isSelf ? 'lb-self' : ''}"><div class="lb-rank ${rankClass}">${rankEmoji}</div>${avatar}<div class="lb-name">${escapeHtml(entry.name)}</div><div class="lb-score">${scoreFormat(entry)}</div></div>`;
    }).join('');
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ====== LEADERBOARD UI ======
let lbRefreshInterval = null;

leaderboardBtn.addEventListener('click', async () => {
    leaderboardOverlay.classList.add('open');
    if (state.leaderboardData && state.leaderboardData.length > 0) renderLeaderboard(state.leaderboardData, state.leaderboardTab);
    else leaderboardList.innerHTML = '<div class="lb-loading">Yükleniyor...</div>';
    const data = await fetchLeaderboard(true);
    renderLeaderboard(data, state.leaderboardTab);
    clearInterval(lbRefreshInterval);
    lbRefreshInterval = setInterval(async () => {
        if (!leaderboardOverlay.classList.contains('open')) { clearInterval(lbRefreshInterval); return; }
        renderLeaderboard(await fetchLeaderboard(true), state.leaderboardTab);
    }, 30000);
});

leaderboardClose.addEventListener('click', () => { leaderboardOverlay.classList.remove('open'); clearInterval(lbRefreshInterval); });
leaderboardOverlay.addEventListener('click', (e) => { if (e.target === leaderboardOverlay) { leaderboardOverlay.classList.remove('open'); clearInterval(lbRefreshInterval); } });

lbTabs.forEach(tab => {
    tab.addEventListener('click', async () => {
        lbTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.leaderboardTab = tab.dataset.type;
        renderLeaderboard(state.leaderboardData || await fetchLeaderboard(), state.leaderboardTab);
    });
});

// ====== SUBMIT BUTTON ======
submitScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim();
    if (!name) { playerNameInput.focus(); playerNameInput.style.borderColor = '#ff6b6b'; setTimeout(() => playerNameInput.style.borderColor = '', 1500); return; }

    // Determine value based on current game type
    let value = 0, type = state.gameType, label = '', mode = null;
    if (type === 'cps') { value = state.lastSessionCps; mode = state.lastSessionMode; label = 'CPS'; }
    else if (type === 'reaction') { value = state.reactionTimes.length ? Math.min(...state.reactionTimes) : 0; label = 'Reaksiyon'; }
    else if (type === 'accuracy') { value = state.lastAccuracyScore; label = 'Doğruluk'; }
    else if (type === 'number') { value = state.lastNumberTime; label = 'Sayı'; }
    else if (type === 'color') { value = state.lastColorScore; label = 'Renk'; }

    if (!value || value <= 0) {
        submitScoreBtn.textContent = 'Önce test yap!'; submitScoreBtn.style.opacity = '0.6';
        setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.style.opacity = ''; }, 2500); return;
    }
    if (!state.registeredName) {
        if (await isNameTaken(name)) {
            submitScoreBtn.textContent = `"${name}" alınmış!`;
            submitScoreBtn.style.opacity = '0.6';
            setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.style.opacity = ''; }, 2500);
            showNotification(`"${name}" ismi alınmış, başka bir isim seç!`, 'warning');
            return;
        }
        state.registeredName = name; localStorage.setItem('registeredName', name);
        playerNameInput.readOnly = true; state.nameChangeUsed = true;
        localStorage.setItem('nameChangeUsed', 'true'); changeNameBtn.style.display = 'none';
        updateChangelogVisibility();
    }
    submitScoreBtn.disabled = true; submitScoreBtn.textContent = 'Gönderiliyor...';
    const success = await submitScore(name, value, mode, type);
    if (success) {
        submitScoreBtn.textContent = `✓ ${label} gönderildi!`;
        lbTabs.forEach(t => t.classList.toggle('active', t.dataset.type === type));
        state.leaderboardTab = type;
        renderLeaderboard(state.leaderboardData || [], type);
        setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.disabled = false; }, 2000);
    } else { submitScoreBtn.textContent = 'Hata! Tekrar Dene'; submitScoreBtn.disabled = false; }
});

// ====== START ======
init();
fetchLeaderboard();
