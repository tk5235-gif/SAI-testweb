/* ── リロード時は必ずページ先頭へ（#アンカー指定がある場合はその位置を尊重） ── */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('load', () => {
    if (!location.hash) window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {

    /* ── ローダー ── */
    const loader = document.getElementById('loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => loader.classList.add('is-hidden'), 1400);
        });
        setTimeout(() => loader.classList.add('is-hidden'), 2600); // フォールバック
    }

    /* ── 画像の読み込み演出（ロード完了でフェードイン） ── */
    document.querySelectorAll('.mem-photo img').forEach(img => {
        if (img.complete) return;              // キャッシュ済みは即時表示
        img.classList.add('is-loading');
        img.addEventListener('load', () => img.classList.remove('is-loading'), { once: true });
        img.addEventListener('error', () => img.classList.remove('is-loading'), { once: true });
    });

    /* ── HERO 写真クロスフェード ── */
    const heroSlides = document.querySelectorAll('.hero-slide');
    if (heroSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        let heroIdx = 0;
        setInterval(() => {
            heroSlides[heroIdx].classList.remove('is-active');
            heroIdx = (heroIdx + 1) % heroSlides.length;
            heroSlides[heroIdx].classList.add('is-active');
        }, 5000);
    }

    /* ── マグネティックCTA（カーソルに軽く吸い付く微反応） ── */
    if (window.matchMedia('(min-width: 901px)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.recruit-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * 0.25;
                const y = (e.clientY - r.top - r.height / 2) * 0.4;
                btn.style.setProperty('--mx', x.toFixed(1) + 'px');
                btn.style.setProperty('--my', y.toFixed(1) + 'px');
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.setProperty('--mx', '0px');
                btn.style.setProperty('--my', '0px');
            });
        });
    }

    /* ── ヘッダー スクロール ── */
    const header = document.getElementById('header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ── ハンバーガーメニュー ── */
    const toggle = document.getElementById('navToggle');
    const mobile = document.getElementById('navMobile');
    const links = mobile.querySelectorAll('a');
    const closeMenu = () => {
        toggle.classList.remove('is-open');
        mobile.classList.remove('is-open');
        document.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
        const open = mobile.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    });
    links.forEach(a => a.addEventListener('click', closeMenu));

    /* ── スクロールリビール ── */
    const reveals = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                io.unobserve(e.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    reveals.forEach(el => io.observe(el));

    /* ── 数字カウントアップ ── */
    const counters = document.querySelectorAll('[data-count]');
    const countIO = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const raw = el.dataset.count;
            const isFloat = raw.indexOf('.') !== -1;
            const target = parseFloat(raw);
            const isYear = !isFloat && target > 1900;
            const dur = 1600;
            const start = performance.now();
            const from = isYear ? target - 30 : 0;
            const fmt = (v) => isFloat ? v.toFixed(1) : Math.floor(v).toString();
            const step = (now) => {
                const p = Math.min((now - start) / dur, 1);
                const ease = 1 - Math.pow(1 - p, 3);
                el.textContent = fmt(from + (target - from) * ease);
                if (p < 1) requestAnimationFrame(step);
                else el.textContent = fmt(target);
            };
            requestAnimationFrame(step);
            countIO.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(el => countIO.observe(el));

    /* ── HEROパララックス（マウス追従） ── */
    const heroGradient = document.querySelector('.hero-gradient');
    const heroCopy = document.querySelector('.hero-copy');
    if (window.matchMedia('(min-width: 901px)').matches) {
        window.addEventListener('mousemove', (ev) => {
            const x = (ev.clientX / window.innerWidth - 0.5);
            const y = (ev.clientY / window.innerHeight - 0.5);
            if (heroGradient) heroGradient.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
            if (heroCopy) heroCopy.style.transform = `translate(${x * 12}px, ${y * 8}px)`;
        });
    }

    /* ── 粒子アニメーション ── */
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], mouse = { x: -999, y: -999 };

    // 星の色：白を主体に、青白・淡青を散らし、ごく稀に赤のアクセント
    const colors = [
        'rgba(255,255,255,', 'rgba(255,255,255,', 'rgba(255,255,255,',
        'rgba(206,221,255,', 'rgba(150,185,255,', 'rgba(255,170,190,'
    ];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    function initParticles() {
        // 密度アップで夜空らしく（上限も引き上げ）
        const count = Math.min(Math.floor((w * h) / 9000), 170);
        particles = [];
        for (let i = 0; i < count; i++) {
            const bright = Math.random() < 0.16; // 一部を明るい輝星に
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                r: bright ? Math.random() * 1.4 + 1.3 : Math.random() * 1.1 + 0.3,
                c: bright ? 'rgba(255,255,255,' : colors[Math.floor(Math.random() * colors.length)],
                a: Math.random() * 0.45 + (bright ? 0.45 : 0.25),
                bright: bright,
                // 瞬き（twinkle）用の位相と速さ
                tw: Math.random() * Math.PI * 2,
                tws: Math.random() * 0.04 + 0.012
            });
        }
    }
    function draw() {
        ctx.clearRect(0, 0, w, h);
        // 線（星座のように近い星をうっすら結ぶ）
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            // マウス反発
            const dxm = p.x - mouse.x, dym = p.y - mouse.y;
            const dm = Math.hypot(dxm, dym);
            if (dm < 120) {
                p.x += (dxm / dm) * 1.2;
                p.y += (dym / dm) * 1.2;
            }

            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 130) * 0.06})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.stroke();
                }
            }
            // 瞬き：alpha を時間で揺らす
            p.tw += p.tws;
            const twinkle = 0.65 + 0.35 * Math.sin(p.tw);
            const alpha = Math.min(p.a * twinkle, 1);
            if (p.bright) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = 'rgba(180,205,255,0.9)';
            }
            ctx.beginPath();
            ctx.fillStyle = p.c + alpha.toFixed(3) + ')';
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        requestAnimationFrame(draw);
    }
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseout', () => { mouse.x = -999; mouse.y = -999; });
    window.addEventListener('resize', () => { resize(); initParticles(); });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        resize(); initParticles(); draw();
    }
    } // end if(canvas)

    /* ── 部署アコーディオン ── */
    const deptToggles = document.querySelectorAll('.dept-toggle');
    deptToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const wrap = btn.nextElementSibling;
            const open = btn.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (wrap && wrap.classList.contains('dept-members-wrap')) {
                wrap.classList.toggle('is-open', open);
            }
        });
    });

    /* ── timetable：事業部別タブ切り替え ── */
    const timetableTabs = document.querySelectorAll('.timetable-tab');
    const timetablePanels = document.querySelectorAll('.timetable-panel');
    timetableTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const dept = tab.dataset.dept;
            timetableTabs.forEach(t => {
                t.classList.toggle('is-active', t === tab);
                t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            timetablePanels.forEach(p => {
                p.classList.toggle('is-active', p.dataset.dept === dept);
            });
        });
    });

    /* ── 働き方ページ：職種タブ切り替え（営業 / CS） ── */
    const wsTabs = document.querySelectorAll('.ws-tab');
    const wsPanels = document.querySelectorAll('.ws-panel');
    if (wsTabs.length && wsPanels.length) {
        const wsActivate = (role) => {
            wsTabs.forEach(t => t.classList.toggle('is-active', t.dataset.role === role));
            wsPanels.forEach(p => p.classList.toggle('is-active', p.dataset.role === role));
        };
        wsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                wsActivate(tab.dataset.role);
                history.replaceState(null, '', '#' + tab.dataset.role);
                const hero = document.querySelector('.ws-hero');
                if (hero) window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        // URLハッシュ（#cs / #sales）で初期タブを選択
        const initRole = location.hash === '#cs' ? 'cs' : (location.hash === '#sales' ? 'sales' : null);
        if (initRole) wsActivate(initRole);
    }

    /* ── お問い合わせフォーム（リアルタイム検証＋メール作成） ── */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const setErr = (field, msg) => {
            const wrap = field.closest('.form-field') || field.closest('.form-check')?.parentElement;
            const err = contactForm.querySelector(`.form-error[data-for="${field.id}"]`);
            const ok = !msg;
            if (wrap && wrap.classList.contains('form-field')) {
                wrap.classList.toggle('is-invalid', !ok);
                wrap.classList.toggle('is-valid', ok && field.value.trim() !== '');
            }
            if (err) { err.textContent = msg || ''; err.classList.toggle('is-shown', !ok); }
            return ok;
        };
        const validate = (field) => {
            if (field.type === 'checkbox') return setErr(field, field.checked ? '' : '同意が必要です。');
            const v = field.value.trim();
            if (field.required && !v) return setErr(field, '入力してください。');
            if (field.type === 'email' && v && !emailRe.test(v)) return setErr(field, 'メールアドレスの形式をご確認ください。');
            return setErr(field, '');
        };
        const fields = ['cf-name', 'cf-email', 'cf-type', 'cf-message', 'cf-agree']
            .map(id => document.getElementById(id)).filter(Boolean);
        fields.forEach(f => {
            const ev = (f.tagName === 'SELECT' || f.type === 'checkbox') ? 'change' : 'blur';
            f.addEventListener(ev, () => validate(f));
            f.addEventListener('input', () => { if ((f.closest('.form-field') || {}).classList?.contains('is-invalid')) validate(f); });
        });
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let firstInvalid = null;
            fields.forEach(f => { if (!validate(f) && !firstInvalid) firstInvalid = f; });
            if (firstInvalid) { firstInvalid.focus(); return; }
            const g = id => (document.getElementById(id).value || '').trim();
            const subject = `【お問い合わせ／${g('cf-type')}】${g('cf-name')}`;
            const body =
                `お名前：${g('cf-name')}\n` +
                `会社名：${g('cf-company')}\n` +
                `メール：${g('cf-email')}\n` +
                `電話：${g('cf-tel')}\n` +
                `種別：${g('cf-type')}\n\n` +
                `【お問い合わせ内容】\n${g('cf-message')}\n`;
            // ※ 送信先。Formspree等に切り替える場合はこの mailto を form action に差し替え
            window.location.href = `mailto:info@saigroupe.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }

});
