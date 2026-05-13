// ====== CPS & REAKSIYON TESTI ======
const BUILD_VERSION = '2026-05-10 v15:00';

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
    // Color test
    colorState: 'idle', colorCorrect: 0, colorWrong: 0,
    colorTimer: null, colorEndTime: 0, colorDuration: 30,
    colorTargetColor: '', colorTargetWord: '',
    colorBest: parseInt(localStorage.getItem('colorBest')) || 0,
    lastColorScore: 0,
    // Sequence Memory
    sequenceState: 'idle', sequenceLevel: 1, sequencePattern: [],
    sequencePlayerIndex: 0, sequenceShowing: false,
    sequenceBest: parseInt(localStorage.getItem('sequenceBest')) || 0,
    lastSequenceScore: 0,
    // Luck Test
    luckState: 'idle', luckLevel: 1, luckScore: 0, luckLives: 3,
    luckLivesMax: 5, luckLivesStart: 3,
    luckNeedlePos: 0, luckNeedleDir: 1, luckAnimId: null,
    luckCombo: 0, luckMaxCombo: 0,
    luckPerfects: 0, luckGreats: 0, luckGoods: 0, luckMisses: 0,
    luckBest: parseInt(localStorage.getItem('luckBest')) || 0,
    lastLuckScore: 0,
    // UI prefs
    avatar: localStorage.getItem('avatar') || '',
    theme: localStorage.getItem('theme') || 'dark',
    selectedTitle: (() => {
        try { return JSON.parse(localStorage.getItem('selectedTitle') || 'null'); }
        catch { return null; }
    })(),
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

// Luck Test
const luckSection = document.getElementById('luck-section');
const luckMessage = document.getElementById('luck-message');
const luckBarWrap = document.getElementById('luck-bar-wrap');
const luckNeedle = document.getElementById('luck-needle');
const luckTargetZone = document.getElementById('luck-target-zone');
const luckGreatZone = document.getElementById('luck-great-zone');
const luckPerfectZone = document.getElementById('luck-perfect-zone');
const luckTapHint = document.getElementById('luck-tap-hint');
const luckLevelEl = document.getElementById('luck-level');
const luckScoreEl = document.getElementById('luck-score');
const luckLivesEl = document.getElementById('luck-lives');
const luckComboEl = document.getElementById('luck-combo');
const luckParticles = document.getElementById('luck-particles');
const luckComboPopup = document.getElementById('luck-combo-popup');
const statLuckBest = document.getElementById('stat-luck-best');
const statLuckLast = document.getElementById('stat-luck-last');

// Sequence Memory
const sequenceSection = document.getElementById('sequence-section');
const sequenceGrid = document.getElementById('sequence-grid');
const sequenceTiles = document.querySelectorAll('.sequence-tile');
const sequenceMessage = document.getElementById('sequence-message');
const sequenceLevelEl = document.getElementById('sequence-level');
const sequenceLength = document.getElementById('sequence-length');
const statSequenceBest = document.getElementById('stat-sequence-best');
const statSequenceLast = document.getElementById('stat-sequence-last');

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
    // Show build version badge
    const vBadge = document.createElement('div');
    vBadge.textContent = BUILD_VERSION;
    vBadge.style.cssText = 'position:fixed;bottom:6px;right:8px;font-size:10px;opacity:0.35;color:#fff;pointer-events:none;z-index:9999;font-family:monospace;';
    document.body.appendChild(vBadge);

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
            state.nameChangeUsed = false;
            localStorage.removeItem('nameChangeUsed');
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
        state.leaderboardData = null; lbCacheTime = 0;
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

const ADMIN_LABELS = { cps: 'CPS', reaction: 'Reaksiyon', accuracy: 'Doğruluk', color: 'Renk', sequence: 'Sıra', luck: 'Şans' };

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
    } else if (tabType === 'color') {
        const c = data.filter(e => e.type === 'color' && typeof e.score === 'number');
        const best = {};
        c.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.score > best[k].score) best[k] = e; });
        entries = Object.values(best).sort((a, b) => b.score - a.score);
        scoreFmt = (e) => `${e.score} doğru`;
    } else if (tabType === 'sequence') {
        const s = data.filter(e => e.type === 'sequence' && typeof e.score === 'number');
        const best = {};
        s.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.score > best[k].score) best[k] = e; });
        entries = Object.values(best).sort((a, b) => b.score - a.score);
        scoreFmt = (e) => `${e.score} seviye`;
    } else if (tabType === 'luck') {
        const l = data.filter(e => e.type === 'luck' && typeof e.score === 'number');
        const best = {};
        l.forEach(e => { const k = e.name.toLowerCase(); if (!best[k] || e.score > best[k].score) best[k] = e; });
        entries = Object.values(best).sort((a, b) => b.score - a.score);
        scoreFmt = (e) => `${e.score} puan`;
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
            <button class="admin-delete-btn" data-name="${escapeHtml(e.name)}">Sil</button>
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
    muteBtn.textContent = state.muted ? 'Ses Kapalı' : 'Ses Açık';
    muteBtn.classList.toggle('muted', state.muted);
}

function updateChangelogVisibility() {
    const btn = document.getElementById('changelog-btn');
    const adminBtn = document.getElementById('admin-btn');
    if (!btn) return;
    const name = (state.registeredName || playerNameInput.value.trim()).toLowerCase();
    const isAdmin = name === 'everseekn' || name === 'destroy' || name === 'destoroy' || name === 'atlantalıhoca' || localStorage.getItem('adminPrivilege') === 'true';
    if (isAdmin) localStorage.setItem('adminPrivilege', 'true');
    btn.style.display = isAdmin ? '' : 'none';
    if (adminBtn) adminBtn.style.display = isAdmin ? '' : 'none';
}

function hasUnlimitedNameChange(nameToCheck = null) {
    if (localStorage.getItem('unlimitedNameChange') === 'true') return true;
    const name = (nameToCheck || state.registeredName || playerNameInput.value.trim()).toLowerCase();
    if (name === 'shoso' || name === '8887888888888888' || name === 'wethermoon' || name === 'parry' || name === 'destroy' || name === 'destoroy' || name === 'atlantalıhoca') {
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
    color: 'RENK TESTİ',
    sequence: 'SIRA HAFIZASI',
    luck: 'ŞANS TESTİ',
};

// Global touch-scroll guard: prevents buttons from firing during scroll
let _touchScrolling = false;
document.addEventListener('touchstart', (e) => { _touchScrolling = false; }, { passive: true });
document.addEventListener('touchmove', () => { _touchScrolling = true; }, { passive: true });

gameTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (_touchScrolling) return;
        if (state.isRunning || state.isCountdown || state.accuracyState === 'running' || state.colorState === 'running' || state.sequenceState === 'running' || state.sequenceShowing || state.luckState === 'running') return;
        gameTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.gameType = btn.dataset.type;

        // Hide all sections
        cpsSection.style.display = 'none';
        reactionSection.style.display = 'none';
        accuracySection.style.display = 'none';
        colorSection.style.display = 'none';
        sequenceSection.style.display = 'none';
        luckSection.style.display = 'none';

        // Reset other modes' last scores so submit picks correct one
        state.lastSessionCps = 0;
        state.lastReactionTime = 0;
        state.lastAccuracyScore = 0;
        state.lastColorScore = 0;
        state.lastSequenceScore = 0;
        state.lastLuckScore = 0;

        document.querySelector('#header h1').textContent = GAME_TITLES[state.gameType];

        if (state.gameType === 'cps') {
            cpsSection.style.display = '';
        } else if (state.gameType === 'reaction') {
            reactionSection.style.display = '';
            resetReaction();
        } else if (state.gameType === 'accuracy') {
            accuracySection.style.display = '';
            resetAccuracy();
        } else if (state.gameType === 'color') {
            colorSection.style.display = '';
            resetColorTest();
        } else if (state.gameType === 'sequence') {
            sequenceSection.style.display = '';
            resetSequence();
        } else if (state.gameType === 'luck') {
            luckSection.style.display = '';
            resetLuck();
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
    if (state.isRunning && state.currentCps > (state.sessionMaxCps || 0)) {
        state.sessionMaxCps = state.currentCps;
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
    const cps = state.currentCps;
    if (cps < 500) {
        clickButton.classList.add('pressing');
        setTimeout(() => clickButton.classList.remove('pressing'), 60);
    }
    if (cps < 12) playClickSound();
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
    state.sessionMaxCps = 0;
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
    const sessionBestCps = Math.max(state.sessionMaxCps || 0, state.currentCps);
    state.lastSessionCps = sessionBestCps;
    state.lastSessionMode = state.timeLimit;
    const name = playerNameInput.value.trim();
    if (name && sessionBestCps > 0) {
        if (!state.registeredName) {
            state.registeredName = name;
            localStorage.setItem('registeredName', name);
            playerNameInput.readOnly = true;
            if (!hasUnlimitedNameChange(name)) {
                state.nameChangeUsed = true;
                localStorage.setItem('nameChangeUsed', 'true');
                changeNameBtn.style.display = 'none';
            }
        }
        autoSubmitIfBest('cps', sessionBestCps, state.timeLimit);
    }
}

// ====== UNIFIED AUTO SUBMIT ======
// Submits score to leaderboard ONLY if it's a new personal best.
// Type config: cps/accuracy higher=better, reaction/number lower=better.
const AUTO_SUBMIT_CONFIG = {
    cps:      { field: 'cps',   higherBetter: true,  matchType: (e) => !e.type || e.type === 'cps' },
    reaction: { field: 'time',  higherBetter: false, matchType: (e) => e.type === 'reaction' },
    accuracy: { field: 'score', higherBetter: true,  matchType: (e) => e.type === 'accuracy' },
    color:    { field: 'score', higherBetter: true,  matchType: (e) => e.type === 'color' },
    sequence: { field: 'score', higherBetter: true,  matchType: (e) => e.type === 'sequence' },
    luck:     { field: 'score', higherBetter: true,  matchType: (e) => e.type === 'luck' },
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
            if (time < 200) { rating = 'İnanılmaz!'; color = '#2ecc71'; }
            else if (time < 250) { rating = 'Çok hızlı!'; color = '#48dbfb'; }
            else if (time < 350) { rating = 'İyi!'; color = '#feca57'; }
            else if (time < 500) { rating = 'Fena değil'; color = '#ff9ff3'; }
            else { rating = 'Yavaşlamışsın'; color = '#ff6b6b'; }
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
                        if (!hasUnlimitedNameChange(name)) {
                            state.nameChangeUsed = true;
                            localStorage.setItem('nameChangeUsed', 'true');
                            changeNameBtn.style.display = 'none';
                        }
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
    notif.innerHTML = `<span class="notif-text">${message}</span><div class="notif-progress"></div>`;
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

const TYPE_LABELS = { cps: 'CPS', reaction: 'Reaksiyon', accuracy: 'Doğruluk', color: 'Renk', sequence: 'Sıra', luck: 'Şans' };

// Titles shown under names in the leaderboard for top 5 of each game type.
// Edit these to set the title text per (gameType, rank). Empty string = no title.
const LEADERBOARD_TITLES = {
    cps:      { 1: 'CPS Kralı',       2: 'CPS Ustası',       3: 'CPS Uzmanı',        4: 'CPS Yeteneği',      5: 'CPS Yıldızı' },
    reaction: { 1: 'Yıldırım',         2: 'Şimşek',           3: 'Hızlı',             4: 'Çevik',             5: 'Yetenekli' },
    accuracy: { 1: 'Keskin Nişancı',   2: 'Avcı',             3: 'Nişancı',           4: 'Hedefçi',           5: 'Acemi Nişancı' },
    color:    { 1: 'Renk Ustası',      2: 'Renk Uzmanı',      3: 'Renk Yeteneği',     4: 'Renk Yıldızı',      5: 'Renk Acemisi' },
    sequence: { 1: 'Hafıza Tanrısı',   2: 'Hafıza Ustası',    3: 'Hafıza Uzmanı',     4: 'Hafıza Yeteneği',   5: 'Hafıza Yıldızı' },
    luck:     { 1: 'Şanslı',           2: 'Talihli',          3: 'Bahtlı',            4: 'Talih Yıldızı',     5: 'Şans Acemisi' },
};
function getLeaderboardTitle(gameType, rank) {
    return (LEADERBOARD_TITLES[gameType] && LEADERBOARD_TITLES[gameType][rank]) || '';
}

// Rank-based colors for default titles
const TITLE_RANK_COLORS = { 1: '#f0c040', 2: '#c0c0c0', 3: '#cd7f32', 4: '#48dbfb', 5: '#48dbfb' };
// Available colors for custom titles (rank-1 perk)
const CUSTOM_TITLE_COLORS = ['#f0c040', '#e74c3c', '#2ecc71', '#48dbfb', '#9b59b6', '#ff6b9d', '#ffffff', '#ff7f50'];

// Compute a player's best rank for a given game type from leaderboard data.
// Returns 1..N or 0 if not present.
function getPlayerBestRank(name, type, data) {
    const cfg = AUTO_SUBMIT_CONFIG[type];
    if (!cfg) return 0;
    const entries = data.filter(e => cfg.matchType(e) && typeof e[cfg.field] === 'number');
    const bestPerPlayer = {};
    entries.forEach(e => {
        const k = (e.name || '').toLowerCase();
        if (!k) return;
        const v = e[cfg.field];
        if (!bestPerPlayer[k] || (cfg.higherBetter ? v > bestPerPlayer[k][cfg.field] : v < bestPerPlayer[k][cfg.field])) {
            bestPerPlayer[k] = e;
        }
    });
    const sorted = Object.values(bestPerPlayer).sort((a, b) =>
        cfg.higherBetter ? b[cfg.field] - a[cfg.field] : a[cfg.field] - b[cfg.field]
    );
    const idx = sorted.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
    return idx >= 0 ? idx + 1 : 0;
}

// Returns array of titles the player owns (top 5 in any game).
// Each item: { source, type, rank, text, color }
function getOwnedTitles(name, data) {
    const owned = [];
    if (!name) return owned;
    Object.keys(LEADERBOARD_TITLES).forEach(type => {
        const rank = getPlayerBestRank(name, type, data);
        if (rank >= 1 && rank <= 5) {
            const text = LEADERBOARD_TITLES[type][rank];
            if (text) owned.push({
                source: `${type}-${rank}`,
                type, rank, text,
                color: TITLE_RANK_COLORS[rank] || '#f0c040',
            });
        }
    });
    return owned;
}

function canCustomTitle(name, data) {
    return getOwnedTitles(name, data).some(t => t.rank === 1);
}

// Sync the current selectedTitle to all of this player's leaderboard entries.
async function syncTitleToLeaderboard() {
    if (!state.registeredName) return;
    const data = await fetchLeaderboard(true);
    const lname = state.registeredName.toLowerCase();
    let touched = false;
    data.forEach(e => {
        if ((e.name || '').toLowerCase() === lname) {
            if (state.selectedTitle && state.selectedTitle.text) {
                if (!e.title || e.title.text !== state.selectedTitle.text || e.title.color !== state.selectedTitle.color) {
                    e.title = { text: state.selectedTitle.text, color: state.selectedTitle.color };
                    touched = true;
                }
            } else if (e.title) {
                delete e.title;
                touched = true;
            }
        }
    });
    if (!touched) return;
    if (isJsonBinConfigured()) {
        try {
            await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY },
                body: JSON.stringify({ scores: data }),
            });
            state.leaderboardData = data;
            lbCacheTime = 0;
            localStorage.setItem('leaderboardCache', JSON.stringify(data));
        } catch (err) { console.error('Title sync error:', err); }
    } else {
        state.leaderboardData = data;
        localStorage.setItem('leaderboard', JSON.stringify(data));
    }
}

function setSelectedTitle(title) {
    // title: { source, text, color } or null
    state.selectedTitle = title;
    if (title) localStorage.setItem('selectedTitle', JSON.stringify(title));
    else localStorage.removeItem('selectedTitle');
}

function showRankNotification(rank, type) {
    const label = TYPE_LABELS[type] || type;
    const rankText = `${rank}.`;
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
    try {
        if (await isNameTaken(newName)) {
            nameModalInput.style.borderColor = '#e74c3c';
            nameModalText.innerHTML = `<b>"${escapeHtml(newName)}"</b> ismi başka biri tarafından kullanılıyor! Farklı bir isim seç.`;
            nameModalInput.value = ''; nameModalInput.focus(); return;
        }
    } catch (err) {
        console.error('Name check error:', err);
        nameModalText.innerHTML = 'İsim kontrolü başarısız. Tekrar dene.';
        return;
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
        try {
            const data = state.leaderboardData || await fetchLeaderboard();
            let changed = false;
            const oldNameNormalized = oldName.toLowerCase().trim();
            data.forEach(e => {
                const entryName = (e.name || '').toLowerCase().trim();
                if (entryName === oldNameNormalized) {
                    e.name = newName;
                    changed = true;
                    console.log(`Updated entry: ${e.name} -> ${newName}`);
                }
            });
            if (changed) {
                if (isJsonBinConfigured()) {
                    try {
                        const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY },
                            body: JSON.stringify({ scores: data })
                        });
                        if (!res.ok) {
                            console.error('Rename API error:', res.status);
                            nameModalText.innerHTML = 'İsim değişikliği kaydedilemedi. Sunucu hatası.';
                            return;
                        }
                        // Verify the update by fetching again
                        lbCacheTime = 0;
                        const verifyData = await fetchLeaderboard(true);
                        const stillHasOldName = verifyData.some(e => e.name.toLowerCase() === oldName.toLowerCase());
                        if (stillHasOldName) {
                            console.error('Name change verification failed: old name still exists');
                            nameModalText.innerHTML = 'İsim değişikliği doğrulanamadı. Eski isim hala görünüyor.';
                            return;
                        }
                    } catch (err) {
                        console.error('Rename error:', err);
                        nameModalText.innerHTML = 'İsim değişikliği kaydedilemedi. Bağlantı hatası.';
                        return;
                    }
                } else {
                    localStorage.setItem('leaderboard', JSON.stringify(data));
                }
                state.leaderboardData = data;
                // Force cache refresh
                lbCacheTime = 0;
                localStorage.setItem('leaderboardCache', JSON.stringify(data));
                // Refresh leaderboard if visible
                if (leaderboardOverlay.classList.contains('open')) {
                    await fetchLeaderboard(true);
                    renderLeaderboard(state.leaderboardData, state.leaderboardTab);
                }
            }
        } catch (err) {
            console.error('Leaderboard update error:', err);
            nameModalText.innerHTML = 'İsim değişikliği başarısız. Tekrar dene.';
            return;
        }
    }
    nameModal.classList.remove('open');
    nameModalInput.style.borderColor = '';
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
        if (_touchScrolling) return;
        if (state.isCountdown || state.isRunning) return;
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeLimit = parseInt(btn.dataset.time);
        resetGame();
    });
});

// ====== CPS EVENTS ======
clickButton.addEventListener('mousedown', handleClick);
let _clickTouchStartY = 0;
clickButton.addEventListener('touchstart', (e) => {
    _clickTouchStartY = e.touches[0].clientY;
    if (state.isRunning) {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++)
            handleClick({ clientX: e.changedTouches[i].clientX, clientY: e.changedTouches[i].clientY });
    }
}, { passive: false });
clickButton.addEventListener('touchend', (e) => {
    if (!state.isRunning && !state.isCountdown && !state.gameEnded) {
        const dy = Math.abs((e.changedTouches[0]?.clientY ?? _clickTouchStartY) - _clickTouchStartY);
        if (dy < 10) { e.preventDefault(); handleClick({ clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }); }
    }
}, { passive: false });
clickButton.addEventListener('contextmenu', e => e.preventDefault());

// ====== REACTION EVENTS ======
reactionBox.addEventListener('mousedown', handleReactionClick);
let _reactionTouchStartY = 0;
reactionBox.addEventListener('touchstart', (e) => {
    _reactionTouchStartY = e.touches[0].clientY;
    if (state.reactionState === 'waiting' || state.reactionState === 'running') {
        e.preventDefault();
        handleReactionClick(e);
    }
}, { passive: false });
reactionBox.addEventListener('touchend', (e) => {
    if (state.reactionState === 'idle' || state.reactionState === 'result') {
        const dy = Math.abs((e.changedTouches[0]?.clientY ?? _reactionTouchStartY) - _reactionTouchStartY);
        if (dy < 10) { e.preventDefault(); handleReactionClick(e); }
    }
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
    if (!av || av === '??' || av === '?' || (!isAvatarUrl(av) && !AVATAR_OPTIONS.includes(av))) return '';
    if (isAvatarUrl(av)) return `<img src="${av}" class="${cls}-img" alt="" referrerpolicy="no-referrer">`;
    return `<span class="${cls}">${av}</span>`;
}

function setAvatarButton(av) {
    if (!avatarBtn) return;
    if (isAvatarUrl(av)) {
        avatarBtn.innerHTML = `<img src="${av}" alt="" referrerpolicy="no-referrer">`;
    } else if (av && AVATAR_OPTIONS.includes(av)) {
        avatarBtn.textContent = av;
    } else {
        avatarBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
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
        statusEl.textContent = 'Yüklendi!';
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
    { type: 'cps',      icon: '', label: 'CPS',      field: 'cps',   higherBetter: true,
      fmt: (e) => `${Math.round(e.cps || 0).toLocaleString()} CPS` },
    { type: 'reaction', icon: '', label: 'Reaksiyon', field: 'time',  higherBetter: false,
      fmt: (e) => `${Math.round(e.time)} ms` },
    { type: 'accuracy', icon: '', label: 'Doğruluk',  field: 'score', higherBetter: true,
      fmt: (e) => `${e.score} vuruş` },
    { type: 'color',    icon: '', label: 'Renk',      field: 'score', higherBetter: true,
      fmt: (e) => `${e.score} doğru` },
    { type: 'sequence', icon: '', label: 'Sıra',      field: 'score', higherBetter: true,
      fmt: (e) => `${e.score} seviye` },
    { type: 'luck',     icon: '',  label: 'Şans',      field: 'score', higherBetter: true,
      fmt: (e) => `${e.score} puan` },
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
        if (isAvatarUrl(av)) {
            avatarEl.innerHTML = `<img src="${av}" alt="" referrerpolicy="no-referrer">`;
        } else if (av && AVATAR_OPTIONS.includes(av)) {
            avatarEl.innerHTML = ''; avatarEl.textContent = av;
        } else {
            avatarEl.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
            avatarEl.style.display = 'flex'; avatarEl.style.alignItems = 'center'; avatarEl.style.justifyContent = 'center';
        }
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
    setProfileAvatar(state.avatar);
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

    // Title display + change button visibility
    const titleEl = document.getElementById('profile-current-title');
    const changeTitleBtn = document.getElementById('change-title-btn');
    const owned = getOwnedTitles(myName, data);
    if (state.selectedTitle && state.selectedTitle.text) {
        titleEl.textContent = state.selectedTitle.text;
        titleEl.style.color = state.selectedTitle.color || '#f0c040';
    } else {
        titleEl.textContent = owned.length ? 'Title seç →' : '';
        titleEl.style.color = '#7a8a9a';
    }
    changeTitleBtn.style.display = owned.length > 0 ? '' : 'none';

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
    const changePhotoBtn = document.getElementById('profile-change-photo-btn');
    if (!btn) return;
    btn.addEventListener('click', openProfileModal);
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            renderAvatarGrid();
            avatarModal.classList.add('open');            const onAvatarClose = () => {
                avatarModal.classList.remove('open');
                openProfileModal();
                avatarClose.removeEventListener('click', onAvatarClose);
            };
            avatarClose.addEventListener('click', onAvatarClose);
        });
    }
    initTitlePicker();
}

// ====== TITLE PICKER ======
function initTitlePicker() {
    const changeBtn = document.getElementById('change-title-btn');
    const modal = document.getElementById('title-picker-modal');
    const closeBtn = document.getElementById('title-picker-close');
    const clearBtn = document.getElementById('clear-title-btn');
    if (!changeBtn || !modal) return;

    changeBtn.addEventListener('click', openTitlePicker);
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    clearBtn.addEventListener('click', async () => {
        setSelectedTitle(null);
        modal.classList.remove('open');
        await syncTitleToLeaderboard();
        openProfileModal();
    });
}

async function openTitlePicker() {
    const modal = document.getElementById('title-picker-modal');
    const list = document.getElementById('owned-titles-list');
    const customSection = document.getElementById('custom-title-section');
    const customInput = document.getElementById('custom-title-input');
    const customColors = document.getElementById('custom-title-colors');
    const customApply = document.getElementById('custom-title-apply');

    const name = (state.registeredName || playerNameInput.value.trim() || '').trim();
    if (!name) return;

    modal.classList.add('open');
    list.innerHTML = '<div class="title-option-empty">Yükleniyor...</div>';

    const data = await fetchLeaderboard();
    const owned = getOwnedTitles(name, data);
    const canCustom = canCustomTitle(name, data);

    if (owned.length === 0) {
        list.innerHTML = '<div class="title-option-empty">Henüz title kazanmadın. İlk 5\'e gir!</div>';
    } else {
        list.innerHTML = owned.map(t => {
            const isSel = state.selectedTitle && state.selectedTitle.source === t.source;
            return `<div class="title-option ${isSel ? 'selected' : ''}" data-source="${t.source}">
                <div>
                    <div class="title-option-text" style="color:${t.color}">${escapeHtml(t.text)}</div>
                    <div class="title-option-meta">${TYPE_LABELS[t.type] || t.type} #${t.rank}</div>
                </div>
                <div style="font-size:0.75rem;color:${t.color}">${isSel ? '✓' : 'Seç'}</div>
            </div>`;
        }).join('');
        list.querySelectorAll('.title-option').forEach(el => {
            el.addEventListener('click', async () => {
                const src = el.dataset.source;
                const t = owned.find(x => x.source === src);
                if (!t) return;
                setSelectedTitle({ source: t.source, text: t.text, color: t.color });
                modal.classList.remove('open');
                await syncTitleToLeaderboard();
                openProfileModal();
            });
        });
    }

    // Custom title: only for rank-1 holders
    customSection.style.display = canCustom ? '' : 'none';
    if (canCustom) {
        // Pre-fill if custom currently selected
        if (state.selectedTitle && state.selectedTitle.source === 'custom') {
            customInput.value = state.selectedTitle.text;
        }
        // Render color swatches
        let selectedColor = (state.selectedTitle && state.selectedTitle.source === 'custom')
            ? state.selectedTitle.color
            : CUSTOM_TITLE_COLORS[0];
        const renderSwatches = () => {
            const presetIsActive = CUSTOM_TITLE_COLORS.includes(selectedColor);
            const swatchesHtml = CUSTOM_TITLE_COLORS.map(c =>
                `<div class="title-color-swatch ${c === selectedColor ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
            ).join('');
            // Color wheel picker as the last swatch (rainbow gradient = native color picker)
            const wheelHtml = `
                <label class="title-color-wheel ${!presetIsActive ? 'selected' : ''}"
                       style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);"
                       title="Renk çarkı">
                    <input type="color" id="custom-title-color-input" value="${selectedColor}" style="opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;">
                </label>`;
            customColors.innerHTML = swatchesHtml + wheelHtml;
            customColors.querySelectorAll('.title-color-swatch').forEach(s => {
                s.addEventListener('click', () => {
                    selectedColor = s.dataset.color;
                    renderSwatches();
                });
            });
            const colorInput = document.getElementById('custom-title-color-input');
            if (colorInput) {
                colorInput.addEventListener('input', (e) => {
                    selectedColor = e.target.value;
                    renderSwatches();
                });
            }
        };
        renderSwatches();
        customApply.onclick = async () => {
            const text = (customInput.value || '').trim();
            if (!text) { customInput.focus(); return; }
            if (isInappropriateName(text)) { showNotification('Uygunsuz title!', 'warning'); return; }
            // Uniqueness check: no other player can hold this exact custom title text (case-insensitive)
            customApply.disabled = true;
            customApply.textContent = 'Kontrol ediliyor...';
            try {
                const freshData = await fetchLeaderboard(true);
                const selfLname = name.toLowerCase();
                const tLower = text.toLowerCase();
                const taken = freshData.some(e =>
                    e.title && typeof e.title.text === 'string'
                    && e.title.text.trim().toLowerCase() === tLower
                    && (e.name || '').toLowerCase() !== selfLname
                );
                if (taken) {
                    showNotification(`"${text}" title'ı başka biri tarafından alınmış!`, 'warning');
                    customApply.disabled = false;
                    customApply.textContent = 'Özeli Uygula';
                    return;
                }
            } catch (err) {
                console.error('Title uniqueness check failed:', err);
            }
            setSelectedTitle({ source: 'custom', text, color: selectedColor });
            modal.classList.remove('open');
            customApply.disabled = false;
            customApply.textContent = 'Özeli Uygula';
            await syncTitleToLeaderboard();
            openProfileModal();
        };
    }
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
            status.className = 'success'; status.textContent = 'Yüklendi!';
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
    else if (state.gameType === 'color') resetColorTest();
    else if (state.gameType === 'sequence') resetSequence();
    else if (state.gameType === 'luck') resetLuck();
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.gameType === 'cps') {
            if (state.gameEnded) resetGame(); else handleClick({ clientX: 0, clientY: 0 });
        } else if (state.gameType === 'reaction') {
            handleReactionClick(e);
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
    if (state.selectedTitle && state.selectedTitle.text) entry.title = { text: state.selectedTitle.text, color: state.selectedTitle.color };
    if (type === 'cps') { entry.cps = value; entry.mode = mode; }
    else if (type === 'accuracy' || type === 'color' || type === 'sequence' || type === 'luck') { entry.score = value; }
    else { entry.time = value; }  // reaction
    if (!isJsonBinConfigured()) {
        const data = getLocalLeaderboard();
        upsertScore(data, entry, type);
        localStorage.setItem('leaderboard', JSON.stringify(data));
        state.leaderboardData = data; return true;
    }
    try {
        const current = await fetchLeaderboard();
        upsertScore(current, entry, type);
        const trimmed = trimLeaderboard(current);
        const res = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_CONFIG.API_KEY },
            body: JSON.stringify({ scores: trimmed })
        });
        if (!res.ok) throw new Error('Submit error');
        state.leaderboardData = trimmed; lbCacheTime = 0; return true;
    } catch (err) {
        console.error('Submit error:', err);
        const data = getLocalLeaderboard();
        upsertScore(data, entry, type);
        localStorage.setItem('leaderboard', JSON.stringify(data));
        state.leaderboardData = data; return true;
    }
}

function trimLeaderboard(data) {
    const result = [];

    // CPS: keep best per player per mode
    const cpsEntries = data.filter(e => !e.type || e.type === 'cps');
    const cpsBest = {};
    cpsEntries.forEach(e => {
        const k = `${e.name.toLowerCase()}|${e.mode ?? 5}`;
        if (!cpsBest[k] || e.cps > cpsBest[k].cps) cpsBest[k] = e;
    });
    result.push(...Object.values(cpsBest));

    // Other types: keep best per player
    ['reaction', 'accuracy', 'color', 'sequence', 'luck'].forEach(type => {
        const entries = data.filter(e => e.type === type);
        const best = {};
        entries.forEach(e => {
            const k = e.name.toLowerCase();
            const existing = best[k];
            const lowerBetter = type === 'reaction';
            const v = lowerBetter ? e.time : e.score;
            const ev = existing ? (lowerBetter ? existing.time : existing.score) : null;
            if (!existing || (lowerBetter ? v < ev : v > ev)) best[k] = e;
        });
        result.push(...Object.values(best));
    });

    return result;
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
    } else if (type === 'sequence' || type === 'luck') {
        const idx = data.findIndex(e => e.type === type && e.name.toLowerCase() === lname);
        if (idx >= 0) { if ((entry.score || 0) > (data[idx].score || 0)) { data[idx].score = entry.score; data[idx].date = entry.date; } }
        else data.push(entry);
    }
    // Sync avatar on existing entries
    if (entry.avatar) {
        data.forEach(e => { if (e.name.toLowerCase() === lname) e.avatar = entry.avatar; });
    }
    // Sync title on existing entries (or clear if not set)
    if (entry.title) {
        data.forEach(e => { if (e.name.toLowerCase() === lname) e.title = entry.title; });
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
    } else if (tabType === 'color') {
        const c = data.filter(e => e.type === 'color' && typeof e.score === 'number');
        const bestPerPlayer = {};
        c.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.score > bestPerPlayer[key].score) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => b.score - a.score);
        scoreFormat = (e) => `${e.score} <span>doğru</span>`;
    } else if (tabType === 'sequence') {
        const s = data.filter(e => e.type === 'sequence' && typeof e.score === 'number');
        const bestPerPlayer = {};
        s.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.score > bestPerPlayer[key].score) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => b.score - a.score);
        scoreFormat = (e) => `${e.score} <span>seviye</span>`;
    } else if (tabType === 'luck') {
        const l = data.filter(e => e.type === 'luck' && typeof e.score === 'number');
        const bestPerPlayer = {};
        l.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.score > bestPerPlayer[key].score) bestPerPlayer[key] = e;
        });
        entries = Object.values(bestPerPlayer).sort((a, b) => b.score - a.score);
        scoreFormat = (e) => `${e.score} <span>puan</span>`;
    }

    if (entries.length === 0) { leaderboardList.innerHTML = '<div class="lb-empty">Henüz skor yok!</div>'; return; }
    leaderboardList.innerHTML = entries.map((entry, i) => {
        const rank = i + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const isSelf = entry.name.toLowerCase() === playerName;
        const avatar = avatarHtml(entry.avatar, 'lb-avatar');
        // Title priority: player's chosen title (entry.title) > rank-based default for this tab
        let titleText = '', titleColor = '';
        if (entry.title && entry.title.text) {
            titleText = entry.title.text;
            titleColor = entry.title.color || TITLE_RANK_COLORS[Math.min(rank, 5)] || '#f0c040';
        } else {
            const defaultText = getLeaderboardTitle(tabType, rank);
            if (defaultText) {
                titleText = defaultText;
                titleColor = TITLE_RANK_COLORS[rank] || '#f0c040';
            }
        }
        const nameHtml = titleText
            ? `<div class="lb-name-wrap"><div class="lb-name">${escapeHtml(entry.name)}</div><div class="lb-title" style="color:${titleColor}">${escapeHtml(titleText)}</div></div>`
            : `<div class="lb-name">${escapeHtml(entry.name)}</div>`;
        return `<div class="lb-row ${isSelf ? 'lb-self' : ''}"><div class="lb-rank ${rankClass}">${rank}</div>${avatar}${nameHtml}<div class="lb-score">${scoreFormat(entry)}</div></div>`;
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
    else if (type === 'color') { value = state.lastColorScore; label = 'Renk'; }
    else if (type === 'sequence') { value = state.lastSequenceScore; label = 'Sıra'; }
    else if (type === 'luck') { value = state.lastLuckScore; label = 'Şans'; }

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
        submitScoreBtn.textContent = `${label} gönderildi!`;
        lbTabs.forEach(t => t.classList.toggle('active', t.dataset.type === type));
        state.leaderboardTab = type;
        renderLeaderboard(state.leaderboardData || [], type);
        setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.disabled = false; }, 2000);
    } else { submitScoreBtn.textContent = 'Hata! Tekrar Dene'; submitScoreBtn.disabled = false; }
});

// ====== SEQUENCE MEMORY ======
let _seqAbortController = null;

function getSequenceSpeed() {
    // Speed up as level increases: 500ms on/off at level 1, down to 200ms at level 10+
    const ms = Math.max(200, 500 - (state.sequenceLevel - 1) * 30);
    return ms;
}

async function showSequence() {
    const controller = { aborted: false };
    _seqAbortController = controller;

    state.sequenceShowing = true;
    sequenceMessage.textContent = 'İzle...';
    sequenceTiles.forEach(t => t.classList.remove('sequence-active', 'sequence-wrong'));

    const ms = getSequenceSpeed();

    for (let i = 0; i < state.sequencePattern.length; i++) {
        if (controller.aborted) return;
        await new Promise(r => setTimeout(r, ms * 0.5));
        if (controller.aborted) return;
        const idx = state.sequencePattern[i];
        sequenceTiles[idx].classList.add('sequence-active');
        playClickSound();
        await new Promise(r => setTimeout(r, ms));
        if (controller.aborted) return;
        sequenceTiles[idx].classList.remove('sequence-active');
    }

    await new Promise(r => setTimeout(r, ms * 0.4));
    if (controller.aborted) return;
    state.sequenceShowing = false;
    state.sequencePlayerIndex = 0;
    sequenceMessage.textContent = 'Tekrar et!';
}

function handleSequenceClick(idx) {
    if (state.sequenceState === 'idle' || state.sequenceState === 'ended') {
        startSequence();
        return;
    }
    if (state.sequenceState !== 'running' || state.sequenceShowing) return;

    if (idx === state.sequencePattern[state.sequencePlayerIndex]) {
        sequenceTiles[idx].classList.add('sequence-active');
        playClickSound();
        setTimeout(() => sequenceTiles[idx].classList.remove('sequence-active'), 180);
        state.sequencePlayerIndex++;

        if (state.sequencePlayerIndex >= state.sequencePattern.length) {
            state.sequenceLevel++;
            sequenceLevelEl.textContent = state.sequenceLevel;
            sequenceLength.textContent = state.sequencePattern.length + 1;
            sequenceMessage.textContent = 'Harika!';
            state.sequencePattern.push(Math.floor(Math.random() * 9));
            sequenceLength.textContent = state.sequencePattern.length;
            setTimeout(() => showSequence(), 600);
        }
    } else {
        sequenceTiles[idx].classList.add('sequence-wrong');
        setTimeout(() => {
            sequenceTiles.forEach(t => t.classList.remove('sequence-wrong'));
        }, 500);
        endSequence();
    }
}

function startSequence() {
    state.sequenceState = 'running';
    state.sequenceLevel = 1;
    state.sequencePattern = [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)];
    sequenceLevelEl.textContent = '1';
    sequenceLength.textContent = '3';
    showSequence();
}

function endSequence() {
    if (_seqAbortController) _seqAbortController.aborted = true;
    state.sequenceState = 'ended';
    state.sequenceShowing = false;
    const finalScore = state.sequenceLevel - 1;
    sequenceMessage.innerHTML = `<span class="game-result-big">${finalScore}</span><span class="game-result-label">Seviye · Tekrar için tıkla</span>`;
    state.lastSequenceScore = finalScore;
    statSequenceLast.textContent = finalScore;
    if (finalScore > state.sequenceBest) {
        state.sequenceBest = finalScore;
        localStorage.setItem('sequenceBest', finalScore);
        statSequenceBest.textContent = finalScore;
    }
    playEndSound();
    autoSubmitIfBest('sequence', finalScore);
}

function resetSequence() {
    if (_seqAbortController) _seqAbortController.aborted = true;
    state.sequenceState = 'idle';
    state.sequenceLevel = 1;
    state.sequencePattern = [];
    state.sequencePlayerIndex = 0;
    state.sequenceShowing = false;
    sequenceLevelEl.textContent = '1';
    sequenceLength.textContent = '3';
    sequenceTiles.forEach(t => t.classList.remove('sequence-active', 'sequence-wrong'));
    sequenceMessage.innerHTML = 'Sırayı izle ve tekrar et<br><span style="font-size:0.85rem;color:#f0c040">Başlamak için tıkla</span>';
}

sequenceTiles.forEach((tile, idx) => {
    tile.addEventListener('click', () => handleSequenceClick(idx));
});

sequenceMessage.addEventListener('click', () => { if (state.sequenceState === 'idle' || state.sequenceState === 'ended') startSequence(); });

// ====== LUCK TEST ======
// Tier system: target zone has nested PERFECT (center 1/4) and GREAT (center 1/2) sub-zones.
// Score = baseTier * levelMult * comboMult.
// Combo resets on miss. Every 10 perfects → +1 life (max 5).

function getLuckTargetWidth() {
    // Slower shrink so progression feels rewarding longer: 50% → min 10%
    return Math.max(10, 50 - (state.luckLevel - 1) * 2.5);
}

function getLuckSpeed() {
    // % per millisecond — base + level scaling, with combo-flow bonus capped
    return 0.045 + (state.luckLevel - 1) * 0.007;
}

function getLuckLevelMult() {
    // Caps at 10x so insane levels don't snowball
    return Math.min(10, state.luckLevel);
}

function getLuckComboMult() {
    // 0 streak → x1.0, 20 streak → x3.0
    return Math.min(3, 1 + state.luckCombo * 0.1);
}

function updateLuckLives() {
    luckLivesEl.textContent = `${state.luckLives}/${state.luckLivesMax}`;
}

function updateLuckCombo() {
    const mult = getLuckComboMult();
    luckComboEl.textContent = `x${mult.toFixed(1)}`;
    luckComboEl.style.color = mult >= 2.5 ? '#2ecc71' : mult >= 1.8 ? '#48dbfb' : mult >= 1.3 ? '#f0c040' : '#c0c8d0';
}

function renderLuckBar() {
    const targetW = getLuckTargetWidth();
    const targetLeft = (100 - targetW) / 2;
    luckTargetZone.style.left = `${targetLeft}%`;
    luckTargetZone.style.width = `${targetW}%`;

    // GREAT zone is the inner half of target
    const greatW = targetW * 0.5;
    luckGreatZone.style.left = `${(100 - greatW) / 2}%`;
    luckGreatZone.style.width = `${greatW}%`;

    // PERFECT zone is the inner quarter of target
    const perfectW = targetW * 0.25;
    luckPerfectZone.style.left = `${(100 - perfectW) / 2}%`;
    luckPerfectZone.style.width = `${perfectW}%`;
}

let _luckLastTime = 0;
let _luckTrackW = 0;
function animateLuck(ts) {
    if (state.luckState !== 'running') return;
    if (_luckLastTime === 0) { _luckLastTime = ts; _luckTrackW = luckNeedle.parentElement.offsetWidth || 340; }
    const dt = Math.min(ts - _luckLastTime, 32);
    _luckLastTime = ts;
    const speed = getLuckSpeed();
    state.luckNeedlePos += state.luckNeedleDir * speed * dt;
    if (state.luckNeedlePos >= 100) { state.luckNeedlePos = 100; state.luckNeedleDir = -1; }
    if (state.luckNeedlePos <= 0)   { state.luckNeedlePos = 0;   state.luckNeedleDir = 1; }
    const px = (state.luckNeedlePos / 100) * _luckTrackW - 3;
    luckNeedle.style.transform = `translateX(${px}px)`;
    state.luckAnimId = requestAnimationFrame(animateLuck);
}

function spawnLuckParticles(color, count) {
    if (!luckParticles) return;
    const px = (state.luckNeedlePos / 100) * (_luckTrackW || luckNeedle.parentElement.offsetWidth || 340);
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'luck-particle';
        p.style.background = color;
        p.style.left = `${px}px`;
        p.style.top = '50%';
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 60;
        p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        luckParticles.appendChild(p);
        setTimeout(() => p.remove(), 700);
    }
}

function showLuckCombo(text, color) {
    luckComboPopup.textContent = text;
    luckComboPopup.style.color = color;
    luckComboPopup.classList.remove('combo-show');
    void luckComboPopup.offsetWidth; // reflow to restart animation
    luckComboPopup.classList.add('combo-show');
}

function setLuckHintClass(cls) {
    luckTapHint.className = '';
    if (cls) luckTapHint.classList.add(cls);
}

function setNeedleClass(cls) {
    luckNeedle.className = '';
    if (cls) luckNeedle.classList.add(cls);
}

function handleLuckTap() {
    if (state.luckState === 'idle' || state.luckState === 'ended') { startLuck(); return; }
    if (state.luckState !== 'running') return;

    state.luckState = 'pausing';
    cancelAnimationFrame(state.luckAnimId);
    state.luckAnimId = null;

    const targetW = getLuckTargetWidth();
    const distFromCenter = Math.abs(state.luckNeedlePos - 50);
    const inTarget  = distFromCenter <= targetW / 2;
    const inGreat   = distFromCenter <= targetW / 4;
    const inPerfect = distFromCenter <= targetW / 8;

    const levelMult = getLuckLevelMult();
    const comboMult = getLuckComboMult();
    const luckZoneNode = document.getElementById('luck-zone');

    let tier, basePoints, color, hintCls, needleCls, hintText;
    if (inPerfect)     { tier = 'perfect'; basePoints = 100; color = '#2ecc71'; hintCls = 'hint-perfect'; needleCls = 'needle-perfect'; hintText = 'MÜKEMMEL!'; }
    else if (inGreat)  { tier = 'great';   basePoints = 60;  color = '#48dbfb'; hintCls = 'hint-great';   needleCls = 'needle-great';   hintText = 'HARİKA!'; }
    else if (inTarget) { tier = 'good';    basePoints = 30;  color = '#f0c040'; hintCls = 'hint-good';    needleCls = 'needle-good';    hintText = 'İYİ'; }
    else               { tier = 'miss';    basePoints = 0;   color = '#e74c3c'; hintCls = 'hint-miss';    needleCls = 'needle-miss';    hintText = 'KAÇTI!'; }

    setNeedleClass(needleCls);
    setLuckHintClass(hintCls);
    luckTapHint.textContent = hintText;

    if (tier !== 'miss') {
        // Hit path
        const gained = Math.round(basePoints * levelMult * comboMult);
        state.luckScore += gained;
        state.luckCombo++;
        if (state.luckCombo > state.luckMaxCombo) state.luckMaxCombo = state.luckCombo;
        if (tier === 'perfect') state.luckPerfects++;
        else if (tier === 'great') state.luckGreats++;
        else state.luckGoods++;

        // Bonus life every 10 perfects (cap at max)
        let bonusLife = false;
        if (tier === 'perfect' && state.luckPerfects % 10 === 0 && state.luckLives < state.luckLivesMax) {
            state.luckLives++;
            bonusLife = true;
            updateLuckLives();
        }

        luckScoreEl.textContent = state.luckScore;
        spawnLuckParticles(color, tier === 'perfect' ? 6 : tier === 'great' ? 4 : 3);

        // Combo popup: only show when combo gives extra (>=2 combo or +life)
        if (bonusLife) {
            showLuckCombo('+1 CAN!', '#2ecc71');
        } else if (state.luckCombo >= 2 && (state.luckCombo === 2 || state.luckCombo % 5 === 0)) {
            showLuckCombo(`COMBO x${comboMult.toFixed(1)}`, color);
        } else if (tier === 'perfect') {
            showLuckCombo(`+${gained}`, color);
        }

        state.luckLevel++;
        luckLevelEl.textContent = state.luckLevel;
        updateLuckCombo();
        renderLuckBar();
        playClickSound();

        setTimeout(() => {
            setNeedleClass(null);
            setLuckHintClass(null);
            luckTapHint.textContent = 'DOKUN!';
            state.luckNeedlePos = Math.random() * 100;
            state.luckNeedleDir = Math.random() > 0.5 ? 1 : -1;
            _luckLastTime = 0;
            state.luckState = 'running';
            state.luckAnimId = requestAnimationFrame(animateLuck);
        }, 100);
    } else {
        // Miss path
        state.luckMisses++;
        state.luckCombo = 0;
        state.luckLives--;
        updateLuckLives();
        updateLuckCombo();
        spawnLuckParticles(color, 4);
        luckZoneNode.classList.add('luck-shake');
        setTimeout(() => luckZoneNode.classList.remove('luck-shake'), 260);

        if (state.luckLives <= 0) {
            setTimeout(() => endLuck(), 250);
        } else {
            setTimeout(() => {
                setNeedleClass(null);
                setLuckHintClass(null);
                luckTapHint.textContent = 'DOKUN!';
                state.luckNeedlePos = Math.random() * 100;
                state.luckNeedleDir = Math.random() > 0.5 ? 1 : -1;
                _luckLastTime = 0;
                state.luckState = 'running';
                state.luckAnimId = requestAnimationFrame(animateLuck);
            }, 200);
        }
    }
}

function startLuck() {
    state.luckState = 'running';
    state.luckLevel = 1;
    state.luckScore = 0;
    state.luckLives = state.luckLivesStart;
    state.luckCombo = 0;
    state.luckMaxCombo = 0;
    state.luckPerfects = 0;
    state.luckGreats = 0;
    state.luckGoods = 0;
    state.luckMisses = 0;
    state.luckNeedlePos = Math.random() * 100;
    state.luckNeedleDir = Math.random() > 0.5 ? 1 : -1;
    luckLevelEl.textContent = '1';
    luckScoreEl.textContent = '0';
    updateLuckLives();
    updateLuckCombo();
    luckMessage.style.display = 'none';
    luckBarWrap.style.display = '';
    setNeedleClass(null);
    setLuckHintClass(null);
    luckTapHint.textContent = 'DOKUN!';
    renderLuckBar();
    _luckLastTime = 0;
    state.luckAnimId = requestAnimationFrame(animateLuck);
}

function endLuck() {
    cancelAnimationFrame(state.luckAnimId);
    state.luckState = 'ended';
    luckBarWrap.style.display = 'none';
    luckMessage.style.display = '';
    const hits = state.luckPerfects + state.luckGreats + state.luckGoods;
    const totalTaps = hits + state.luckMisses;
    const acc = totalTaps > 0 ? Math.round((hits / totalTaps) * 100) : 0;
    luckMessage.innerHTML = `
        <span class="game-result-big">${state.luckScore}</span>
        <span class="game-result-label">Puan · Seviye ${state.luckLevel}</span>
        <div style="display:flex;gap:14px;margin-top:10px;flex-wrap:wrap;justify-content:center;font-size:0.8rem;color:#c0c8d0">
            <span style="color:#2ecc71">★ ${state.luckPerfects} perfect</span>
            <span style="color:#48dbfb">${state.luckGreats} harika</span>
            <span style="color:#f0c040">${state.luckGoods} iyi</span>
            <span style="color:#e74c3c">${state.luckMisses} ıska</span>
        </div>
        <div style="display:flex;gap:14px;margin-top:4px;flex-wrap:wrap;justify-content:center;font-size:0.8rem;color:#7a8a9a">
            <span>En yüksek combo: <b style="color:#e8e8e8">x${(1 + state.luckMaxCombo * 0.1 > 3 ? 3 : (1 + state.luckMaxCombo * 0.1)).toFixed(1)}</b></span>
            <span>İsabet: <b style="color:#e8e8e8">${acc}%</b></span>
        </div>
        <span style="color:#7a8a9a;font-size:0.8rem;margin-top:8px">Tekrar için tıkla</span>
    `;
    state.lastLuckScore = state.luckScore;
    statLuckLast.textContent = state.luckScore;
    if (state.luckScore > state.luckBest) {
        state.luckBest = state.luckScore;
        localStorage.setItem('luckBest', state.luckScore);
        statLuckBest.textContent = state.luckScore;
    }
    playEndSound();
    autoSubmitIfBest('luck', state.luckScore);
}

function resetLuck() {
    cancelAnimationFrame(state.luckAnimId);
    state.luckState = 'idle';
    state.luckLevel = 1;
    state.luckScore = 0;
    state.luckLives = state.luckLivesStart;
    state.luckCombo = 0;
    state.luckMaxCombo = 0;
    state.luckPerfects = 0;
    state.luckGreats = 0;
    state.luckGoods = 0;
    state.luckMisses = 0;
    state.luckNeedlePos = 0;
    state.luckNeedleDir = 1;
    state.luckAnimId = null;
    luckLevelEl.textContent = '1';
    luckScoreEl.textContent = '0';
    updateLuckLives();
    updateLuckCombo();
    setNeedleClass(null);
    setLuckHintClass(null);
    luckBarWrap.style.display = 'none';
    luckMessage.style.display = '';
    luckMessage.innerHTML = 'Çubuğu ortada durdur!<br><span style="font-size:0.85rem;color:#f0c040">Başlamak için tıkla</span>';
    statLuckBest.textContent = state.luckBest || '—';
    statLuckLast.textContent = '—';
}

// Use touchstart for zero-delay response on mobile; fallback click for desktop
const luckZoneEl = document.getElementById('luck-zone');
let _luckTouchFired = false;
luckZoneEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    _luckTouchFired = true;
    handleLuckTap();
}, { passive: false });
luckZoneEl.addEventListener('click', () => {
    if (_luckTouchFired) { _luckTouchFired = false; return; }
    handleLuckTap();
});

// ====== START ======
init();
fetchLeaderboard();
