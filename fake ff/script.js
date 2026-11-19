const API_BASE = 'https://api.nexadev.my.id/maker/fakeff';

let busy = false, currentNick = '';

// By Nexa
(function initTheme() {
    const saved = localStorage.getItem('nxTheme') || 'dark';
    if (saved === 'light') document.documentElement.classList.remove('dark');
    document.getElementById('themeIcon').className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
})();
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    document.getElementById('themeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('nxTheme', isDark ? 'dark' : 'light');
}

// By Nexa
const inp = document.getElementById('nickname');
inp.addEventListener('input', function () {
    document.getElementById('charCount').textContent = this.value.length;
    this.classList.remove('error');
});
inp.addEventListener('keypress', e => { if (e.key === 'Enter') generate(); });

// By Nexa
function toast(msg, type = 'success', ms = 3000) {
    const el = document.getElementById('toast');
    const ico = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-circle', info:'fa-info-circle' };
    el.className = `toast ${type}`;
    el.querySelector('i').className = `fas ${ico[type] || 'fa-info-circle'}`;
    document.getElementById('toastMsg').textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), ms);
}

function apiUrl(nick) { return `${API_BASE}?nickname=${encodeURIComponent(nick)}`; }

// ── GENERATE ──
async function generate() {
    if (busy) return;
    const nick = inp.value.trim();
    if (!nick) { toast('Masukkan nickname terlebih dahulu!', 'warning'); inp.classList.add('error'); inp.focus(); return; }
    if (!navigator.onLine) { toast('Kamu sedang offline!', 'error'); return; }

    currentNick = nick;
    busy = true;

    document.getElementById('generateBtn').disabled = true;
    document.getElementById('loading').classList.add('show');
    document.getElementById('errorWrap').classList.remove('show');
    document.getElementById('resultWrap').classList.remove('show');

    try {
        // Load gambar untuk preview (langsung dari API, tampilan saja)
        const img = document.getElementById('resultImg');
        img.onload = () => {
            document.getElementById('loading').classList.remove('show');
            document.getElementById('resultWrap').classList.add('show');
            setTimeout(() => document.getElementById('resultWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            busy = false;
            document.getElementById('generateBtn').disabled = false;
            saveHistory(nick);
            confetti();
            if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
            toast('Berhasil membuat Fake FF!', 'success');
        };
        img.onerror = () => showError('Gagal memuat gambar dari server.');
        img.src = apiUrl(nick);

    } catch (err) {
        showError(err.message || 'Gagal menghubungi server.');
    }
}

// ── SHARE ──
async function shareImage() {
    if (!currentNick) {
        toast('Generate dulu!', 'warning');
        return;
    }

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Fake FF - ${currentNick}`,
                text: `Cek fake FF ku: ${currentNick}`,
                url: window.location.href
            });
        } catch (e) {
            if (e.name !== 'AbortError') {
                await navigator.clipboard.writeText(apiUrl(currentNick));
                toast('Link disalin!', 'success');
            }
        }
    } else {
        await navigator.clipboard.writeText(apiUrl(currentNick));
        toast('Link disalin ke clipboard!', 'success');
    }
}

function openImage() {
    if (!currentNick) return;
    window.open(apiUrl(currentNick), '_blank');
}
function showError(msg) {
    document.getElementById('loading').classList.remove('show');
    document.getElementById('generateBtn').disabled = false;
    document.getElementById('errorDesc').textContent = msg;
    document.getElementById('errorWrap').classList.add('show');
    toast('Gagal membuat gambar', 'error');
    busy = false;
}
function retry() { document.getElementById('errorWrap').classList.remove('show'); generate(); }
function openDirect() {
    const nick = currentNick || inp.value.trim();
    if (!nick) { toast('Masukkan nickname!', 'warning'); return; }
    window.open(apiUrl(nick), '_blank');
    toast('Buka tab baru, tahan gambar untuk simpan', 'info', 4000);
}
function reset() {
    ['resultWrap','errorWrap','loading'].forEach(id => document.getElementById(id).classList.remove('show'));
    document.getElementById('resultImg').src = '';
    document.getElementById('generateBtn').disabled = false;
    inp.value = '';
    document.getElementById('charCount').textContent = '0';
    inp.classList.remove('error');
    inp.focus();
    busy = false; currentNick = '';
}

// ═══════════ ENHANCEMENT v2 ═══════════

// ── Ripple + haptic feedback ──
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-generate, .btn-action, .chip, .btn-retry, .btn-open, .btn-cancel');
    if (!btn) return;
    if (navigator.vibrate) navigator.vibrate(8);
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.width = rip.style.height = size + 'px';
    rip.style.left = (e.clientX - rect.left - size / 2) + 'px';
    rip.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
});

// ── History (localStorage) ──
const HIST_KEY = 'nxHistory';
function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}
function getHistory() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; } catch { return []; }
}
function saveHistory(nick) {
    let h = getHistory().filter(n => n.toLowerCase() !== nick.toLowerCase());
    h.unshift(nick);
    localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 6)));
    renderHistory();
}
function renderHistory() {
    const h = getHistory();
    const wrap = document.getElementById('historyWrap');
    const box = document.getElementById('historyChips');
    if (!h.length) { wrap.classList.remove('show'); return; }
    box.innerHTML = h.map(n => `<button type="button" class="chip" data-nick="${esc(n)}"><i class="fas fa-bolt"></i>${esc(n)}</button>`).join('');
    wrap.classList.add('show');
}
document.getElementById('historyChips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    inp.value = chip.dataset.nick;
    document.getElementById('charCount').textContent = inp.value.length;
    generate();
});
renderHistory();

// ── Confetti sukses ──
function confetti() {
    const wrap = document.getElementById('confettiWrap');
    const colors = ['#ff9500', '#ff5e00', '#ffd166', '#06d6a0', '#4cc9f0', '#ffffff'];
    for (let i = 0; i < 44; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + 'vw';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDuration = (1.5 + Math.random() * 1.6) + 's';
        c.style.animationDelay = (Math.random() * 0.35) + 's';
        if (Math.random() > 0.5) c.style.borderRadius = '50%';
        wrap.appendChild(c);
        setTimeout(() => c.remove(), 3600);
    }
}

// ── Download langsung (fallback: buka manual) ──
async function downloadImage() {
    if (!currentNick) { toast('Generate dulu!', 'warning'); return; }
    toast('Menyiapkan download...', 'info', 1800);
    try {
        const res = await fetch(apiUrl(currentNick));
        if (!res.ok) throw new Error('bad');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FakeFF-${currentNick}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast('Gambar berhasil didownload!', 'success');
    } catch (e) {
        toast('Diblokir browser — buka manual, tahan gambar untuk simpan', 'warning', 3500);
        openDirect();
    }
}

// ── Parallax halus background ──
const blobs = document.querySelectorAll('.mesh-blob');
let tx = 0, ty = 0, px = 0, py = 0;
document.addEventListener('mousemove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 26;
    ty = (e.clientY / window.innerHeight - 0.5) * 26;
});
(function parallax() {
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;
    blobs.forEach((b, i) => {
        const f = 0.4 + i * 0.35;
        b.style.translate = `${px * f}px ${py * f}px`;
    });
    requestAnimationFrame(parallax);
})();
