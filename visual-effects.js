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
