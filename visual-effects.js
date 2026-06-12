(() => {
    const body = document.body;
    if (!body || !body.classList.contains('site-body')) return;
    body.classList.add('site-loading');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const REVEAL_THRESHOLD = 0.14;
    const REVEAL_MARGIN = '0px 0px -8% 0px';
    const PARTICLE_COUNT = 38;
    const MAX_CONNECTION_DISTANCE = 165;
    const PARTICLE_ALPHA = 0.45;
    const MAX_LINE_ALPHA = 0.22;
    const CURSOR_ALPHA = 0.28;
    const CURSOR_RADIUS = 3;
    const SITE_READY_DELAY = 120;
    const MIN_PARTICLE_VELOCITY = -0.25;
    const MAX_PARTICLE_VELOCITY = 0.25;
    const MIN_PARTICLE_RADIUS = 1.2;
    const MAX_PARTICLE_RADIUS = 2.4;
    const COLOR_BLUE_RGB = '16,152,247';
    const COLOR_PURPLE_RGB = '168,130,255';
    const COLOR_RED_RGB = '227,86,84';

    const ensureLayers = () => {
        if (!document.getElementById('constellation')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'constellation';
            canvas.setAttribute('aria-hidden', 'true');
            body.prepend(canvas);
        }

        if (!document.querySelector('.grid-lines')) {
            const grid = document.createElement('div');
            grid.className = 'grid-lines';
            grid.setAttribute('aria-hidden', 'true');
            grid.innerHTML = '<span class="v-line"></span><span class="v-line"></span><span class="v-line"></span>';
            body.prepend(grid);
        }
    };

    const initLoadIn = () => {
        const loadTargets = document.querySelectorAll('.load-in');
        loadTargets.forEach((el, index) => {
            el.style.setProperty('--load-delay', `${index * 70}ms`);
        });
    };

    const initReveal = () => {
        const targets = document.querySelectorAll('section, .card, .blog-card, .photo-card, .blog-article, .contact-details, .experience-item');
        targets.forEach((el) => el.classList.add('reveal'));

        if (reducedMotion) {
            targets.forEach((el) => el.classList.add('is-visible'));
            body.classList.add('site-ready');
            body.classList.remove('site-loading');
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: REVEAL_THRESHOLD, rootMargin: REVEAL_MARGIN }
        );

        targets.forEach((el) => observer.observe(el));
        window.setTimeout(() => {
            body.classList.add('site-ready');
            window.requestAnimationFrame(() => body.classList.remove('site-loading'));
        }, SITE_READY_DELAY);
    };

    const initConstellation = () => {
        const canvas = document.getElementById('constellation');
        if (!canvas || reducedMotion) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        const mouse = { x: null, y: null };
        const particles = [];

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
        };

        const random = (min, max) => Math.random() * (max - min) + min;

        const seedParticles = () => {
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i += 1) {
                particles.push({
                    x: random(0, width),
                    y: random(0, height),
                    vx: random(MIN_PARTICLE_VELOCITY, MAX_PARTICLE_VELOCITY),
                    vy: random(MIN_PARTICLE_VELOCITY, MAX_PARTICLE_VELOCITY),
                    r: random(MIN_PARTICLE_RADIUS, MAX_PARTICLE_RADIUS)
                });
            }
        };

        const step = () => {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i += 1) {
                const a = particles[i];
                a.x += a.vx;
                a.y += a.vy;

                if (a.x < 0 || a.x > width) a.vx *= -1;
                if (a.y < 0 || a.y > height) a.vy *= -1;

                ctx.beginPath();
                ctx.fillStyle = `rgba(${COLOR_BLUE_RGB},${PARTICLE_ALPHA})`;
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particles.length; j += 1) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.hypot(dx, dy);

                    if (distance < MAX_CONNECTION_DISTANCE) {
                        const alpha = (1 - distance / MAX_CONNECTION_DISTANCE) * MAX_LINE_ALPHA;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${COLOR_PURPLE_RGB},${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            if (mouse.x !== null && mouse.y !== null) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(${COLOR_RED_RGB},${CURSOR_ALPHA})`;
                ctx.arc(mouse.x, mouse.y, CURSOR_RADIUS, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(step);
        };

        resize();
        seedParticles();
        step();

        window.addEventListener('resize', () => {
            resize();
            seedParticles();
        });

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        });
    };

    ensureLayers();
    initLoadIn();
    initReveal();
    initConstellation();

    /* ===== Mobile Menu Toggle ===== */
    const initMobileMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const navOverlay = document.querySelector('.nav-overlay');

        if (!menuToggle || !navOverlay) {
            console.warn('[Mobile Menu] Menu toggle or nav overlay not found');
            return;
        }

        // Remove existing listeners by replacing the button
        const newMenuToggle = menuToggle.cloneNode(true);
        menuToggle.parentNode.replaceChild(newMenuToggle, menuToggle);

        const toggleMenu = (forceClose = false) => {
            const isActive = newMenuToggle.classList.contains('active');
            const shouldBeActive = forceClose ? false : !isActive;

            newMenuToggle.classList.toggle('active', shouldBeActive);
            navOverlay.classList.toggle('active', shouldBeActive);
            newMenuToggle.setAttribute('aria-expanded', shouldBeActive.toString());
            navOverlay.setAttribute('aria-hidden', (!shouldBeActive).toString());

            document.body.style.overflow = shouldBeActive ? 'hidden' : '';
        };

        newMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });

        // Close menu when clicking nav links
        const navLinks = navOverlay.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (newMenuToggle.classList.contains('active')) {
                    toggleMenu(true);
                }
            });
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && newMenuToggle.classList.contains('active')) {
                toggleMenu(true);
            }
        });

        // Close when clicking outside nav content
        navOverlay.addEventListener('click', (e) => {
            if (e.target === navOverlay) {
                toggleMenu(true);
            }
        });

        console.log('[Mobile Menu] Initialized successfully');
    };

    // Initialize mobile menu when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }
})();

    /* ===== Footer Ocean Wave Animation ===== */
    // Global mouse tracker — waves respond to cursor anywhere on the page
    let globalMouseX = -1;
    let globalMouseY = -1;
    document.addEventListener('mousemove', (e) => {
        globalMouseX = e.clientX;
        globalMouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
        globalMouseX = -1;
        globalMouseY = -1;
    });

(() => {
    const canvas = document.getElementById('footer-ocean');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let W = 0;
    let H = 0;
    let animId = null;
    let startTime = null;

    // Mouse state with ~0.5s lag — follows globalMouseX anywhere on page
    let targetMouseX = -1;   // instant mouse x (page coords)
    let currentMouseX = -1;   // lagged x shown in the wave (page coords)
    const LERP_ALPHA = 0.035; // ~0.5s exponential lag at 60fps

    const CURSOR_BOOST  = 0.8;
    const CURSOR_RADIUS = 0.30;
    const PHASE_PULL     = 0.6;  // 0–1: how much the peak pulls toward cursor

    // --- Noise displacement: makes motion non-uniform and "alive" ---
    // Deterministic 1D noise from nested sines (no external lib needed)
    const noise1D = (x, t) => {
        const s1 = Math.sin(x * 0.0037 + t * 0.31) * 0.5;
        const s2 = Math.sin(x * 0.0081 + t * 0.17 + s1 * 2.1) * 0.3;
        const s3 = Math.sin(x * 0.0190 + t * 0.09 - s2 * 1.7) * 0.2;
        return s1 + s2 + s3; // range approx -1..1
    };

    // Noise texture follows cursor: the texture "origin" is biased toward currentMouseX
    // so the most active displacement is centered on the cursor
    const displacedX = (x, t, cursorPageX) => {
        if (cursorPageX < 0 || W <= 0) return x;
        // Convert page-x to canvas-local for distance calc
        const footer = canvas.parentElement;
        if (!footer) return x;
        const fRect = footer.getBoundingClientRect();
        const cursorLocalX = cursorPageX - fRect.left;

        // Noise sampling offset: texture center pulled toward cursor
        const textureCenter = cursorLocalX;
        // Add noise-based displacement to x — stronger near cursor
        const dist = Math.abs(x - textureCenter);
        const influence = Math.max(0, 1.0 - dist / (W * 0.45));
        const displacement = noise1D(x, t) * 18.0 * influence;
        return x + displacement;
    };

    const layers = [
        {
            ampBase: 28,
            speed: 3.5,
            color: 'rgba(227, 86, 84, 0.10)',
            octaves: [
                { freq: 0.0018, amp: 1.0,  speedMul: 1.0 },
                { freq: 0.0040, amp: 0.55, speedMul: 1.8 },
                { freq: 0.0090, amp: 0.28, speedMul: 2.8 },
                { freq: 0.0180, amp: 0.14, speedMul: 4.0 },
            ],
            yOffset: 0.65,
        },
        {
            ampBase: 20,
            speed: 4.5,
            color: 'rgba(16, 152, 247, 0.08)',
            octaves: [
                { freq: 0.0022, amp: 1.0,  speedMul: 1.0 },
                { freq: 0.0055, amp: 0.60, speedMul: 1.6 },
                { freq: 0.0120, amp: 0.30, speedMul: 2.4 },
                { freq: 0.0250, amp: 0.15, speedMul: 3.5 },
            ],
            yOffset: 0.76,
        },
        {
            ampBase: 14,
            speed: 5.8,
            color: 'rgba(227, 86, 84, 0.06)',
            octaves: [
                { freq: 0.0030, amp: 1.0,  speedMul: 1.0 },
                { freq: 0.0080, amp: 0.55, speedMul: 2.0 },
                { freq: 0.0180, amp: 0.28, speedMul: 3.2 },
            ],
            yOffset: 0.89,
        },
    ];

    const resize = () => {
        const footer = canvas.parentElement;
        if (!footer) return;
        const rect = footer.getBoundingClientRect();
        W = Math.max(rect.width, 0);
        H = Math.max(rect.height, 0);
        if (W === 0 || H === 0) return;
        const cw = Math.max(1, Math.round(W * dpr));
        const ch = Math.max(1, Math.round(H * dpr));
        if (canvas.width !== cw || canvas.height !== ch) {
            canvas.width  = cw;
            canvas.height = ch;
        }
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // phaseShift pulls the primary octave's peak toward the cursor position
    const waveY = (x, layer, t, mxPage) => {
        const { ampBase, speed, octaves } = layer;
        let amp = ampBase;

        // Cursor amplitude boost (stronger near cursor, using page coords)
        if (mxPage >= 0 && W > 0) {
            const footer = canvas.parentElement;
            if (footer) {
                const fRect = footer.getBoundingClientRect();
                const mxLocal = mxPage - fRect.left;
                const distFrac = Math.abs(x - mxLocal) / (W * CURSOR_RADIUS);
                if (distFrac < 1.0) {
                    const boost = CURSOR_BOOST * (1.0 - distFrac) * (1.0 - distFrac);
                    amp += ampBase * boost;
                }
            }
        }

        // Phase pull: shift primary octave's peak toward cursor position (page coords)
        let phaseShift = 0;
        if (mxPage >= 0 && W > 0) {
            const footer = canvas.parentElement;
            if (footer) {
                const fRect = footer.getBoundingClientRect();
                const mxLocalNorm = (mxPage - fRect.left) / W;
                phaseShift = PHASE_PULL * Math.PI * (mxLocalNorm - 0.5) * 2.0;
            }
        }

        // Apply noise displacement to x — makes motion non-uniform
        const xDisp = displacedX(x, t, mxPage);

        let y = 0;
        for (let i = 0; i < octaves.length; i++) {
            const oct = octaves[i];
            const phase = (i === 0) ? phaseShift : 0;
            y += Math.sin(xDisp * oct.freq * Math.PI * 2 + t * speed * oct.speedMul + phase)
                 * oct.amp * amp;
        }
        const totalAmp = octaves.reduce((s, o) => s + o.amp, 0);
        y /= totalAmp;
        return y;
    };

    const drawLayer = (layer, t, mxPage) => {
        const { color, yOffset } = layer;
        const baseY = H * yOffset;

        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, baseY + waveY(0, layer, t, mxPage));

        const step = Math.max(1, Math.floor(W / 320));
        for (let x = 0; x <= W; x += step) {
            ctx.lineTo(x, baseY + waveY(x, layer, t, mxPage));
        }

        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    };

    const step = () => {
        if (!startTime) startTime = performance.now();
        const t = (performance.now() - startTime) / 1000;

        // Use global mouse position (page coords) with lag
        const rawPageX = globalMouseX;
        if (rawPageX >= 0) {
            if (targetMouseX < 0) targetMouseX = rawPageX;
            targetMouseX += (rawPageX - targetMouseX) * LERP_ALPHA * 3; // pull toward real position
            if (currentMouseX < 0) currentMouseX = targetMouseX;
            currentMouseX += (targetMouseX - currentMouseX) * LERP_ALPHA;
        } else {
            targetMouseX = -1;
            if (currentMouseX >= 0) {
                currentMouseX += (0 - currentMouseX) * LERP_ALPHA * 2;
                if (Math.abs(currentMouseX) < 0.5) currentMouseX = -1;
            }
        }
        const mxPage = currentMouseX;

        if (W === 0 || H === 0) resize();
        ctx.clearRect(0, 0, W, H);
        for (const layer of layers) {
            drawLayer(layer, t, mxPage);
        }
        animId = requestAnimationFrame(step);
    };

    // Init
    resize();
    step();

    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => { resize(); }).observe(canvas.parentElement);
    } else {
        window.addEventListener('resize', () => { resize(); });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { if (animId) { cancelAnimationFrame(animId); animId = null; } }
        else             { if (!animId) step(); }
    });
})();
