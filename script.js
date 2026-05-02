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

const JSONBIN_CONFIG = {
    API_KEY: '$2a$10$af0DhWYHHPpquLjKOUrNEe/QyqURuUFDb2ezuqq.KHballN7UeMAy',
    BIN_ID: '69f5121e36566621a814de8a',
    BASE_URL: 'https://api.jsonbin.io/v3',
};

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

// ====== SOUND ======
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }

function playClickSound() {
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 800 + Math.random() * 400; osc.type = 'sine';
        gain.gain.value = 0.015; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
}

function playEndSound() {
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
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 440; osc.type = 'sine';
        gain.gain.value = 0.06; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } catch(e) {}
}

function playGoBeep() {
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = 'sine';
        gain.gain.value = 0.08; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
}

function playReactionGo() {
    try {
        const ctx = getAudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 600; osc.type = 'sine';
        gain.gain.value = 0.1; gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
}

function playReactionEarly() {
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
        if (state.nameChangeUsed) changeNameBtn.style.display = 'none';
    }
}

// ====== GAME TYPE SELECTOR ======
gameTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.isRunning || state.isCountdown) return;
        gameTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.gameType = btn.dataset.type;
        if (state.gameType === 'cps') {
            cpsSection.style.display = '';
            reactionSection.style.display = 'none';
            document.querySelector('#header h1').textContent = '⚡ CPS TEST ⚡';
            state.lastReactionTime = 0;
        } else {
            cpsSection.style.display = 'none';
            reactionSection.style.display = '';
            document.querySelector('#header h1').textContent = '⚡ REAKSİYON TESTİ ⚡';
            state.lastSessionCps = 0;
            resetReaction();
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
        autoSubmitCps(name, state.currentCps, state.timeLimit);
    }
}

async function autoSubmitCps(name, cps, mode) {
    const prevData = await fetchLeaderboard();
    const prevCpsEntries = prevData.filter(e => (!e.type || e.type === 'cps') && e.name.toLowerCase() === name.toLowerCase());
    const prevBest = prevCpsEntries.length > 0 ? Math.max(...prevCpsEntries.map(e => e.cps)) : 0;
    const isNewBest = cps > prevBest;
    const success = await submitScore(name, cps, mode, 'cps');
    if (success && isNewBest) {
        const data = state.leaderboardData || [];
        const bestPerPlayer = {};
        data.filter(e => e.type === 'cps').forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.cps > bestPerPlayer[key].cps) bestPerPlayer[key] = e;
        });
        const sorted = Object.values(bestPerPlayer).sort((a, b) => b.cps - a.cps);
        const rank = sorted.findIndex(e => e.name.toLowerCase() === name.toLowerCase()) + 1;
        if (rank > 0) showRankNotification(rank, 'cps');
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
                    autoSubmitReaction(name, bestTime);
                }
            }
            break;
    }
}

async function autoSubmitReaction(name, avgTime) {
    const prevData = await fetchLeaderboard();
    const prevEntry = prevData.find(e => e.type === 'reaction' && e.name.toLowerCase() === name.toLowerCase());
    const prevBest = prevEntry ? prevEntry.time : Infinity;
    const isNewBest = avgTime < prevBest;
    const success = await submitScore(name, avgTime, null, 'reaction');
    if (success && isNewBest) {
        const data = state.leaderboardData || [];
        const sorted = data.filter(e => e.type === 'reaction').sort((a, b) => a.time - b.time);
        const rank = sorted.findIndex(e => e.name.toLowerCase() === name.toLowerCase()) + 1;
        if (rank > 0) showRankNotification(rank, 'reaction');
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

function showRankNotification(rank, type) {
    const label = type === 'cps' ? 'CPS' : 'Reaksiyon';
    const rankText = rank === 1 ? '🥇 1.' : rank === 2 ? '🥈 2.' : rank === 3 ? '🥉 3.' : `${rank}.`;
    showNotification(`${label} sıralamasında ${rankText} sıradasın!`, 'rank');
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
    const oldName = state.registeredName;
    playerNameInput.value = newName; localStorage.setItem('playerName', newName);
    state.registeredName = newName; localStorage.setItem('registeredName', newName);
    playerNameInput.readOnly = true; changeNameBtn.style.display = 'none';
    state.nameChangeUsed = true; localStorage.setItem('nameChangeUsed', 'true');
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
});

nameModal.addEventListener('click', (e) => { if (e.target === nameModal) nameModal.classList.remove('open'); });
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

// ====== PREVENT ZOOM ======
document.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

// ====== KEYBOARD ======
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.gameType === 'cps') {
            if (state.gameEnded) resetGame(); else handleClick({ clientX: 0, clientY: 0 });
        } else handleReactionClick(e);
    }
    if (e.code === 'KeyR') { e.preventDefault(); if (state.gameType === 'cps') resetGame(); else resetReaction(); }
});

// ====== RESET BUTTON ======
resetBtn.addEventListener('click', () => { if (state.gameType === 'cps') resetGame(); else resetReaction(); });

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
    const entry = { name, type, date: new Date().toISOString() };
    if (type === 'cps') { entry.cps = value; entry.mode = mode; }
    else { entry.time = value; }
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
    if (type === 'cps') {
        const idx = data.findIndex(e => e.type === 'cps' && e.name.toLowerCase() === entry.name.toLowerCase() && e.mode == entry.mode);
        if (idx >= 0) { if (entry.cps > data[idx].cps) { data[idx].cps = entry.cps; data[idx].date = entry.date; } }
        else data.push(entry);
    } else {
        const idx = data.findIndex(e => e.type === 'reaction' && e.name.toLowerCase() === entry.name.toLowerCase());
        if (idx >= 0) { if (entry.time < data[idx].time) { data[idx].time = entry.time; data[idx].date = entry.date; } }
        else data.push(entry);
    }
}

function renderLeaderboard(data, tabType) {
    const playerName = playerNameInput.value.trim().toLowerCase();
    if (tabType === 'cps') {
        // Include entries with type='cps' or no type (legacy data)
        const cpsEntries = data.filter(e => !e.type || e.type === 'cps');
        const bestPerPlayer = {};
        cpsEntries.forEach(e => {
            const key = e.name.toLowerCase();
            if (!bestPerPlayer[key] || e.cps > bestPerPlayer[key].cps) bestPerPlayer[key] = e;
        });
        const sorted = Object.values(bestPerPlayer).sort((a, b) => b.cps - a.cps);
        if (sorted.length === 0) { leaderboardList.innerHTML = '<div class="lb-empty">Henüz skor yok! 🎮</div>'; return; }
        leaderboardList.innerHTML = sorted.map((entry, i) => {
            const rank = i + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const isSelf = entry.name.toLowerCase() === playerName;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            return `<div class="lb-row ${isSelf ? 'lb-self' : ''}"><div class="lb-rank ${rankClass}">${rankEmoji}</div><div class="lb-name">${escapeHtml(entry.name)}</div><div class="lb-score">${entry.cps} <span>CPS</span></div></div>`;
        }).join('');
    } else {
        const sorted = data.filter(e => e.type === 'reaction' && e.time).sort((a, b) => a.time - b.time);
        if (sorted.length === 0) { leaderboardList.innerHTML = '<div class="lb-empty">Henüz skor yok! 🎮</div>'; return; }
        leaderboardList.innerHTML = sorted.map((entry, i) => {
            const rank = i + 1;
            const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
            const isSelf = entry.name.toLowerCase() === playerName;
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            return `<div class="lb-row ${isSelf ? 'lb-self' : ''}"><div class="lb-rank ${rankClass}">${rankEmoji}</div><div class="lb-name">${escapeHtml(entry.name)}</div><div class="lb-score">${entry.time} <span>ms</span></div></div>`;
        }).join('');
    }
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

    if (state.gameType === 'cps') {
        if (state.lastSessionCps <= 0) {
            submitScoreBtn.textContent = 'Önce test yap!'; submitScoreBtn.style.opacity = '0.6';
            setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.style.opacity = ''; }, 2500); return;
        }
        if (!state.registeredName) {
            state.registeredName = name; localStorage.setItem('registeredName', name);
            playerNameInput.readOnly = true; state.nameChangeUsed = true;
            localStorage.setItem('nameChangeUsed', 'true'); changeNameBtn.style.display = 'none';
        }
        submitScoreBtn.disabled = true; submitScoreBtn.textContent = 'Gönderiliyor...';
        const success = await submitScore(name, state.lastSessionCps, state.lastSessionMode, 'cps');
        if (success) {
            submitScoreBtn.textContent = '✓ CPS gönderildi!';
            lbTabs.forEach(t => t.classList.toggle('active', t.dataset.type === 'cps'));
            state.leaderboardTab = 'cps';
            renderLeaderboard(state.leaderboardData || [], 'cps');
            setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.disabled = false; }, 2000);
        } else { submitScoreBtn.textContent = 'Hata! Tekrar Dene'; submitScoreBtn.disabled = false; }
    } else {
        if (state.lastReactionTime <= 0) {
            submitScoreBtn.textContent = 'Önce test yap!'; submitScoreBtn.style.opacity = '0.6';
            setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.style.opacity = ''; }, 2500); return;
        }
        if (!state.registeredName) {
            state.registeredName = name; localStorage.setItem('registeredName', name);
            playerNameInput.readOnly = true; state.nameChangeUsed = true;
            localStorage.setItem('nameChangeUsed', 'true'); changeNameBtn.style.display = 'none';
        }
        submitScoreBtn.disabled = true; submitScoreBtn.textContent = 'Gönderiliyor...';
        const bestTime = Math.min(...state.reactionTimes);
        const success = await submitScore(name, bestTime, null, 'reaction');
        if (success) {
            submitScoreBtn.textContent = '✓ Reaksiyon gönderildi!';
            lbTabs.forEach(t => t.classList.toggle('active', t.dataset.type === 'reaction'));
            state.leaderboardTab = 'reaction';
            renderLeaderboard(state.leaderboardData || [], 'reaction');
            setTimeout(() => { submitScoreBtn.textContent = 'Skorumu Gönder'; submitScoreBtn.disabled = false; }, 2000);
        } else { submitScoreBtn.textContent = 'Hata! Tekrar Dene'; submitScoreBtn.disabled = false; }
    }
});

// ====== START ======
init();
fetchLeaderboard();
