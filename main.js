/* ═══════════════════════════════
   STARS
═══════════════════════════════ */
(function () {
    const c = document.getElementById('stars-canvas');
    if (!c) return;
    const x = c.getContext('2d');
    let S = [];
    function resize() { c.width = innerWidth; c.height = innerHeight; }
    function init(n = 260) {
        S = Array.from({ length: n }, () => ({
            x: Math.random() * innerWidth, y: Math.random() * innerHeight,
            r: Math.random() * 1.4 + .2, a: Math.random(),
            da: (Math.random() - .5) * .008,
            vx: (Math.random() - .5) * .045, vy: (Math.random() - .5) * .045
        }));
    }
    function draw() {
        x.clearRect(0, 0, c.width, c.height);
        S.forEach(s => {
            s.x = (s.x + s.vx + c.width) % c.width;
            s.y = (s.y + s.vy + c.height) % c.height;
            s.a = Math.max(.04, Math.min(1, s.a + s.da));
            if (s.a <= .04 || s.a >= 1) s.da *= -1;
            x.beginPath(); x.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            x.fillStyle = `rgba(255,255,255,${s.a.toFixed(3)})`; x.fill();
        });
        requestAnimationFrame(draw);
    }
    resize(); init(); draw();
    window.addEventListener('resize', () => { resize(); init(); });
})();

/* ═══════════════════════════════
   HERO & FOOTER PARTICLE SYSTEMS (FINAL SEPARATION)
═══════════════════════════════ */
(function () {
    const heroCanvas = document.getElementById('ring-canvas');
    const DPR = window.devicePixelRatio || 1;
    const mouse = { x: -2000, y: -2000 };
    let lastMove = Date.now();
    let scrollPos = 0;

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        lastMove = Date.now();
    });

    window.addEventListener('scroll', () => {
        scrollPos = window.scrollY;
    }, { passive: true });

    class Dot {
        constructor(x, y, minA = 0.12, maxA = 0.4) {
            this.bx = x; this.by = y;
            this.x = x; this.y = y;
            this.tx = x; this.ty = y;
            this.baseAlpha = minA + Math.random() * (maxA - minA);
            this.alpha = this.baseAlpha;
            this.tAlpha = this.baseAlpha;
            this.active = false;

            this.px = Math.random() * Math.PI * 2;
            this.py = Math.random() * Math.PI * 2;
            this.ps = 0.02 + Math.random() * 0.03;
        }
        update(time, breezeAmp = 5) {
            const ox = Math.sin(time * this.ps + this.px) * breezeAmp;
            const oy = Math.cos(time * this.ps + this.py) * breezeAmp;

            const s = this.active ? 0.06 : 0.025;
            this.x += (this.tx - this.x) * s;
            this.y += (this.ty - this.y) * s;
            this.alpha += (this.tAlpha - this.alpha) * 0.08;
        }
        updateTarget(tx, ty, active, targetAlpha, time, breezeAmp) {
            this.active = active;
            const ox = Math.sin(time * this.ps + this.px) * breezeAmp;
            const oy = Math.cos(time * this.ps + this.py) * breezeAmp;

            if (this.active) {
                this.tx = tx; this.ty = ty;
                this.tAlpha = targetAlpha;
            } else {
                this.tx = this.bx + ox;
                this.ty = this.by + oy;
                this.tAlpha = this.baseAlpha;
            }
            this.update(time, breezeAmp);
        }
        draw(ctx, size) {
            ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
            // Tamaño entero y redondeo al píxel para nitidez máxima
            ctx.fillRect(Math.floor(this.x), Math.floor(this.y), Math.floor(size), Math.floor(size));
        }
    }

    function setupSystem(canvas, color, isHero = false) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false; // Desactivar suavizado para nitidez extra
        let W, H, dots = [];
        const SPACING = 12;
        const radius = 80;
        let time = 0;
        let rotationAngle = 0;

        function resize() {
            const rw = canvas.parentElement.offsetWidth, rh = canvas.parentElement.offsetHeight;
            W = canvas.width = rw * DPR;
            H = canvas.height = rh * DPR;
            canvas.style.width = rw + 'px';
            canvas.style.height = rh + 'px';
            ctx.scale(DPR, DPR); W /= DPR; H /= DPR;
            init();
        }

        function init() {
            dots = [];
            const isMobile = window.innerWidth < 768;
            const SPACING_ADJ = isMobile && isHero ? 14 : SPACING; 
            const cols = Math.floor(W / SPACING_ADJ), rows = Math.floor(H / SPACING_ADJ);
            const ox = (W - cols * SPACING_ADJ) / 2, oy = (H - rows * SPACING_ADJ) / 2;

            const minA = isHero ? 0.24 : 0.6;
            const maxA = isHero ? 0.50 : 0.9;

            for (let r = 0; r <= rows; r++) {
                for (let c = 0; c <= cols; c++) {
                    const d = new Dot(ox + c * SPACING_ADJ, oy + r * SPACING_ADJ, minA, maxA);
                    if (!isHero) {
                        d.vx = (Math.random() - 0.5) * 0.5;
                        d.vy = (Math.random() - 0.5) * 0.5;
                    }
                    dots.push(d);
                }
            }
        }

        function loop() {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = color;
            time++;

            const rect = canvas.getBoundingClientRect();
            const mx = mouse.x - rect.left, my = mouse.y - rect.top;

            if (isHero) {
                rotationAngle += 0.0025;
            }

            dots.forEach((d, i) => {
                const dist = Math.hypot(d.x - mx, d.y - my);
                const active = !isHero && dist < 140; // No mouse reaction on Hero
                const breeze = isHero ? 12 : 5;

                if (isHero) {
                    // MODO GALAXIA CON EXPLOSION POR SCROLL
                    const scrollExplosion = Math.min(scrollPos / 700, 1.5);
                    const cx = W / 2, cy = H / 2;
                    const dx = d.bx - cx, dy = d.by - cy;
                    const distCenter = Math.hypot(dx, dy) * (1 + scrollExplosion * 0.8);
                    const ang = Math.atan2(dy, dx) + rotationAngle * (1 + distCenter / 500);
                    
                    const gtx = cx + Math.cos(ang) * distCenter;
                    const gty = cy + Math.sin(ang) * distCenter;
                    const ox = Math.sin(time * d.ps + d.px) * breeze;
                    const oy = Math.cos(time * d.ps + d.py) * breeze;
                    
                    d.tx = gtx + ox; d.ty = gty + oy; d.tAlpha = d.baseAlpha;
                    d.update(time, breeze);
                } else {
                    // FOOTER: AUTONOMOUS CONSTELLATION (No mouse)
                    d.bx += d.vx * 0.3; d.by += d.vy * 0.3; // Slower drift
                    if (d.bx < 0 || d.bx > W) d.vx *= -1;
                    if (d.by < 0 || d.by > H) d.vy *= -1;

                    // Autonomous "breathing" or pulsing attraction
                    const driftX = Math.sin(time * 0.01 + i) * 15;
                    const driftY = Math.cos(time * 0.01 + i) * 15;
                    
                    d.tx = d.bx + driftX;
                    d.ty = d.by + driftY;
                    
                    d.update(time, breeze);

                    // Draw connections
                    dots.slice(i + 1, i + 15).forEach(d2 => {
                        const ddist = Math.hypot(d.x - d2.x, d.y - d2.y);
                        if (ddist < 85) {
                            ctx.beginPath();
                            ctx.moveTo(d.x, d.y);
                            ctx.lineTo(d2.x, d2.y);
                            ctx.strokeStyle = color;
                            ctx.globalAlpha = (1 - ddist / 85) * 0.18;
                            ctx.stroke();
                        }
                    });
                    d.update(time, breeze);
                }
                const baseSize = 2.4;
                d.draw(ctx, baseSize);
            });
            requestAnimationFrame(loop);
        }
        window.addEventListener('resize', resize);
        resize(); loop();
    }

    setupSystem(heroCanvas, 'rgba(66, 133, 244, 1)', true); // Soft Blue Galaxy
})();

/* ═══════════════════════════════
   REVEAL
═══════════════════════════════ */
(function () {
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: .1 });
    document.querySelectorAll('.reveal,.bc').forEach(el => io.observe(el));
})();

/* ═══════════════════════════════
   CAROUSEL DRAG
═══════════════════════════════ */
/* Carousel drag removed in favor of centered grid layout */

/* ═══════════════════════════════
   NAV TINT ON SCROLL
═══════════════════════════════ */
(function () {
    const nav = document.getElementById('ag-nav');
    if (!nav) return;
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 48), { passive: true });
})();

/* ═══════════════════════════════
   HERO H1 TYPING EFFECT
═══════════════════════════════ */
(function () {
    const h1 = document.querySelector('.hero-h');
    if (!h1) return;

    const elementsToType = [
        "D", "a", "r", "w", "i", "n", " ", "M", "i", "g", "u", "e", "l", " ", "<br>",
        '<span class="g-r">A</span>',
        '<span class="g-r">b</span>',
        '<span class="g-r">a</span>',
        '<span class="g-r">r</span>',
        '<span class="g-r">c</span>',
        '<span class="g-r">a</span>'

    ];

    h1.innerHTML = '<span class="hero-cursor"></span>';
    h1.style.opacity = '1';

    let i = 0;
    function type() {
        if (i < elementsToType.length) {
            const currentHTML = h1.innerHTML;
            h1.innerHTML = currentHTML.replace('<span class="hero-cursor"></span>', elementsToType[i] + '<span class="hero-cursor"></span>');
            i++;
            setTimeout(type, 80 + Math.random() * 100); // Escritura más pausada y humana
        } else {
            setTimeout(() => {
                document.body.classList.add('intro-done');

                // Los cuadros de stats aparecen después (después de que el texto termine su animación)
                // Stats grid appearance trigger
                setTimeout(() => {
                    const grid = document.querySelector('.hero-stats-grid');
                    if (grid) {
                        const observer = new IntersectionObserver((entries) => {
                            if (entries[0].isIntersecting) {
                                grid.classList.add('play-anim');
                                setTimeout(startCounters, 300);
                                observer.disconnect();
                            }
                        }, { threshold: 0.15 });
                        observer.observe(grid);
                    }
                }, 1000);
            }, 800);
        }
    }

    function startCounters() {
        const counters = document.querySelectorAll('.counter');
        const duration = 2000;

        counters.forEach(c => {
            const target = +c.getAttribute('data-target');
            let startTime = null;

            function update(currentTime) {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);
                // Ease out function to decelerate naturally
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);

                c.textContent = Math.floor(easeOutQuart * target);

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    c.textContent = target; // force final value just in case
                }
            }
            requestAnimationFrame(update);
        });
    }

    setTimeout(type, 400);
})();

/* ═══════════════════════════════
   PARTICLE HOVER BRACKETS (RESTORED)
═══════════════════════════════ */
(function () {
    const cards = document.querySelectorAll('.ccard-img');
    const SPACING = 7;
    const DOT_SIZE = 1.2;
    const LERP_IN = 0.15;
    const LERP_OUT = 0.02;
    const SCATTER = 6;
    const ALPHA_LERP = 0.1;
    const DPR = window.devicePixelRatio || 1;

    class DotCard {
        constructor(x, y) {
            this.bx = x; this.by = y;
            this.x = x; this.y = y;
            this.tx = x; this.ty = y;
            this.baseAlpha = 0.15 + Math.random() * 0.2;
            this.alpha = this.baseAlpha;
            this.tAlpha = this.baseAlpha;
            this.active = false;
            this._newScatter();
        }
        _newScatter() {
            const g = () => ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 2;
            this.sx = g() * SCATTER;
            this.sy = g() * SCATTER;
        }
        assignTarget(tx, ty, ta) {
            this.tx = tx; this.ty = ty;
            this.tAlpha = ta;
            this.active = true;
        }
        release() {
            this.tx = this.bx;
            this.ty = this.by;
            this.tAlpha = this.baseAlpha;
            this.active = false;
            this._newScatter();
        }
        update() {
            const s = this.active ? LERP_IN : LERP_OUT;
            this.x += (this.tx - this.x) * s;
            this.y += (this.ty - this.y) * s;
            this.alpha += (this.tAlpha - this.alpha) * ALPHA_LERP;
        }
        draw(ctx) {
            ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
            ctx.fillRect(Math.round(this.x), Math.round(this.y), DOT_SIZE, DOT_SIZE);
        }
    }

    function getCirclePoints(W, H) {
        const pts = [];
        const cx = W / 2, cy = H / 2 - 2;
        const radius = 42;
        const totalPoints = 180;
        for (let i = 0; i < totalPoints; i++) {
            const angle = (i / totalPoints) * Math.PI * 2;
            pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
        }
        return pts.sort(() => Math.random() - 0.5);
    }

    function initParticles() {
        cards.forEach(cardImg => {
            cardImg.style.position = 'relative';
            let canvas = cardImg.querySelector('.particle-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const icon = cardImg.querySelector('.mi');
            const iconColor = icon ? window.getComputedStyle(icon).color : '#ffffff';
            let W = cardImg.offsetWidth || 316, H = cardImg.offsetHeight || 186;
            canvas.width = W * DPR; canvas.height = H * DPR;
            ctx.scale(DPR, DPR);

            let dots = [];
            const cols = Math.floor(W / SPACING), rows = Math.floor(H / SPACING);
            const ox = (W - cols * SPACING) / 2, oy = (H - rows * SPACING) / 2;
            for (let r = 0; r <= rows; r++) {
                for (let c = 0; c <= cols; c++) {
                    dots.push(new DotCard(ox + c * SPACING, oy + r * SPACING));
                }
            }

            let bPts = getCirclePoints(W, H);
            cardImg.parentElement.addEventListener('mouseenter', () => {
                dots.forEach((d, i) => {
                    const sp = bPts[i % bPts.length];
                    const ta = 0.6 + Math.random() * 0.4;
                    d.assignTarget(sp.x, sp.y, ta);
                });
            });
            cardImg.parentElement.addEventListener('mouseleave', () => {
                dots.forEach(d => d.release());
            });

            function loop() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = iconColor;
                dots.forEach(d => { d.update(); d.draw(ctx); });
                requestAnimationFrame(loop);
            }
            loop();
        });
    }
    setTimeout(initParticles, 300);
})();
