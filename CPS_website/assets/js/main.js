// Main JavaScript for MechWorks Project Landing Page

const HIGHLIGHT_TARGETS = Object.freeze({
    implicit_edf_rm: {
        sectionSelector: '#contributions',
        snippet: 'We further developed elastic scheduling for implicit-deadline tasks by introducing faster admission-control methods and polynomial-time exact algorithms for global EDF and global RM'
    }
});

class MechWorksApp {
    constructor() {
        this.sections = document.querySelectorAll('.section');
        this.nav = document.getElementById('site-nav');
        this.navItems = document.querySelectorAll('#site-nav .nav-item');
        this.referenceLinks = document.querySelectorAll('.reference-link');
        this.tooltip = document.getElementById('tooltip');
        this.navToggle = document.getElementById('nav-toggle');
        this.navOverlay = document.getElementById('nav-overlay');

        this.refMap = new Map(); // id -> { title, url }
        this.refs = [];          // full list of reference objects
        this.displayIndexMap = new Map(); // id -> display number
        this.activeChangeHighlight = null;

        this.init();
    }

    async init() {
        // VIP spacing from settings.js (if available)
        this.applyVipSettings();

        // Fetch references to wire title/tooltips/links
        await this.loadReferences();

        this.initScrollAnimations();
        this.initNavigation();
        this.initReferenceTooltipsAndLinks();
        this.initParticlesHero();
        this.initSmoothScrolling();
        this.initHeroEntrance();
        this.initFigureSliders();
        this.initReferenceAnimations();

        // Center-line based nav highlighting
        const onScroll = this.throttle(() => {
            this.updateActiveNavigation();
            if (this.handleNavScrollState) this.handleNavScrollState();
        }, 80);
        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', this.throttle(() => this.updateActiveNavigation(), 120));

        this.updateActiveNavigation();
        this.applyHashHighlightIfPresent();
    }

    // -------------------------------
    // Asset base and URL resolution
    // -------------------------------
    getAssetsBase() {
        // 1) Explicit global override (set before loading this script)
        try {
            if (window.APP_ASSET_BASE) {
                return new URL(window.APP_ASSET_BASE, window.location.href).toString();
            }
        } catch (_) { /* no-op */ }

        // 2) Derive from this script tag (…/assets/js/main.js -> …/assets/)
        try {
            const scripts = Array.from(document.getElementsByTagName('script'));
            const mainScript = scripts.find(s => s.src && /assets\/js\/main\.js(\?|$)/.test(s.src));
            if (mainScript && mainScript.src) {
                return new URL('../', mainScript.src).toString();
            }
        } catch (_) { /* no-op */ }

        // 3) Derive from styles.css if present (…/assets/css/styles.css -> …/assets/)
        try {
            const cssLink = document.querySelector('link[href*="assets/css/styles.css"]');
            if (cssLink && cssLink.href) {
                return new URL('../', cssLink.href).toString();
            }
        } catch (_) { /* no-op */ }

        // 4) Fallback to document-relative assets/
        return 'assets/';
    }

    resolveAssetUrl(pathFromAssets) {
        const base = this.getAssetsBase();
        try {
            return new URL(String(pathFromAssets).replace(/^\/?/, ''), base).toString();
        } catch (_) {
            return `assets/${String(pathFromAssets).replace(/^\/?/, '')}`;
        }
    }

    applyHashHighlightIfPresent() {
        const token = this.getHighlightTokenFromHash();
        if (!token) return;
        window.requestAnimationFrame(() => this.highlightChangeByToken(token));
    }

    getHighlightTokenFromHash() {
        const hash = String(window.location.hash || '');
        const match = hash.match(/^#hl=([A-Za-z0-9_-]+)$/);
        if (!match || !match[1]) return null;
        try {
            return decodeURIComponent(match[1]);
        } catch (_) {
            return match[1];
        }
    }

    highlightChangeByToken(token) {
        const key = String(token || '');
        const config = HIGHLIGHT_TARGETS[key];
        if (!config) {
            console.warn(`[Highlight] Unknown token "${key}".`);
            return;
        }

        const section = document.querySelector(config.sectionSelector);
        if (!section) {
            console.warn(`[Highlight] Section not found for token "${key}": ${config.sectionSelector}`);
            return;
        }

        const snippet = String(config.snippet || '').trim();
        if (!snippet) {
            console.warn(`[Highlight] Missing snippet for token "${key}".`);
            return;
        }

        const range = this.findSnippetRangeInSection(section, snippet);
        if (range) {
            const wrapper = document.createElement('span');
            wrapper.className = 'change-highlight';

            try {
                range.surroundContents(wrapper);
            } catch (err) {
                console.warn(`[Highlight] Failed to wrap snippet for token "${key}".`, err);
                return;
            }

            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.startHighlightLifecycle(wrapper, { removeNodeAfterFade: true });
            return;
        }

        const fallback = this.findElementBySnippet(section, snippet);
        if (fallback) {
            fallback.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.startHighlightLifecycle(fallback, { removeNodeAfterFade: false });
            return;
        }

        console.warn(`[Highlight] Snippet not found for token "${key}".`);
    }

    findSnippetRangeInSection(section, snippet) {
        const regex = this.buildSnippetRegex(snippet);
        if (!regex) return null;

        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (!node || !node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                const parentEl = node.parentElement;
                if (!parentEl) return NodeFilter.FILTER_REJECT;
                if (parentEl.closest('script, style, noscript')) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        let currentNode = walker.nextNode();
        while (currentNode) {
            const text = currentNode.nodeValue;
            if (!text) {
                currentNode = walker.nextNode();
                continue;
            }

            const match = text.match(regex);
            if (match && typeof match.index === 'number') {
                const start = match.index;
                const end = start + match[0].length;
                const range = document.createRange();
                range.setStart(currentNode, start);
                range.setEnd(currentNode, end);
                return range;
            }

            currentNode = walker.nextNode();
        }

        return null;
    }

    findElementBySnippet(section, snippet) {
        const normalizedSnippet = this.normalizeWhitespace(snippet);
        if (!normalizedSnippet) return null;

        const candidates = section.querySelectorAll('p, li, div, span');
        for (const candidate of candidates) {
            const text = this.normalizeWhitespace(candidate.textContent || '');
            if (text.includes(normalizedSnippet)) {
                return candidate;
            }
        }
        return null;
    }

    normalizeWhitespace(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    buildSnippetRegex(snippet) {
        const normalized = this.normalizeWhitespace(snippet);
        if (!normalized) return null;

        const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = escaped.replace(/\s+/g, '\\s+');
        return new RegExp(pattern);
    }

    startHighlightLifecycle(element, options = {}) {
        if (!element) return;

        if (this.activeChangeHighlight && typeof this.activeChangeHighlight.cleanup === 'function') {
            this.activeChangeHighlight.cleanup();
            this.activeChangeHighlight = null;
        }

        const removeNodeAfterFade = !!options.removeNodeAfterFade;
        const totalMs = 10000;
        const fadeMs = 1000;
        const steadyMs = Math.max(0, totalMs - fadeMs);
        const timers = [];

        element.classList.remove('fade-out');
        element.classList.add('change-highlight');

        const cleanup = () => {
            timers.forEach(timerId => clearTimeout(timerId));
            element.classList.remove('change-highlight', 'fade-out');
            if (removeNodeAfterFade && element.parentNode) {
                while (element.firstChild) {
                    element.parentNode.insertBefore(element.firstChild, element);
                }
                element.parentNode.removeChild(element);
            }
        };

        timers.push(setTimeout(() => {
            element.classList.add('fade-out');
        }, steadyMs));

        timers.push(setTimeout(() => {
            cleanup();
            this.activeChangeHighlight = null;
        }, totalMs));

        this.activeChangeHighlight = { cleanup };
    }

    applyVipSettings() {
        try {
            if (window.DesignSystem && DesignSystem.vip && DesignSystem.vip.sectionSpacingY) {
                document.documentElement.style.setProperty('--section-padding-y', DesignSystem.vip.sectionSpacingY);
            }
        } catch (_) { /* no-op */ }
    }

    async loadReferences() {
        let refs = [];
        const refUrl = this.resolveAssetUrl('data/references.json');
        try {
            const res = await fetch(refUrl, { cache: 'no-cache' });
            if (res && res.ok) {
                refs = await res.json();
            } else {
                console.error(`[Refs] Failed to load ${refUrl} (HTTP ${res ? res.status : 'error'}).`);
            }
        } catch (err) {
            console.error('[Refs] Failed to load references JSON:', refUrl, err);
        }

        this.refs = Array.isArray(refs) ? refs : [];
        this.refMap.clear();
        this.refs.forEach(r => {
            this.refMap.set(String(r.id), { title: r.title, url: r.url });
        });

        if (this.refs.length === 0) {
            console.error('[Refs] No references found (empty or failed to parse). URL:', refUrl);
        } else {
            console.log(`[Refs] Loaded ${this.refs.length} references from ${refUrl}.`);
        }

        const citationOrder = this.getCitationOrder();
        this.refs = this.orderRefsByCitation(this.refs, citationOrder);
        this.displayIndexMap.clear();
        this.refs.forEach((ref, index) => {
            this.displayIndexMap.set(String(ref.id), index + 1);
        });

        this.renderReferencesGrid(this.refs);
        this.updateInlineReferenceLabels();

        // Refresh NodeList now that new anchors exist
        this.referenceLinks = document.querySelectorAll('.reference-link');
    }

    getCitationOrder() {
        if (!this.referenceLinks) return [];
        const seen = new Set();
        const order = [];

        this.referenceLinks.forEach(link => {
            const refId = link.getAttribute('data-ref');
            if (!refId || seen.has(refId)) {
                return;
            }

            seen.add(refId);
            order.push(refId);
        });

        return order;
    }

    orderRefsByCitation(refs, citationOrder) {
        if (!Array.isArray(refs) || refs.length === 0) return [];
        if (!Array.isArray(citationOrder) || citationOrder.length === 0) {
            return [...refs];
        }

        const refById = new Map();
        refs.forEach(ref => refById.set(String(ref.id), ref));

        const ordered = [];
        citationOrder.forEach(id => {
            const ref = refById.get(id);
            if (!ref) return;
            ordered.push(ref);
            refById.delete(id);
        });

        refById.forEach(ref => ordered.push(ref));
        return ordered;
    }

    updateInlineReferenceLabels() {
        if (!this.displayIndexMap) return;

        document.querySelectorAll('.reference-link').forEach(link => {
            if (link.closest('#references')) {
                return;
            }

            const refId = link.getAttribute('data-ref');
            if (!refId) return;

            const displayNumber = this.displayIndexMap.get(String(refId));
            if (displayNumber) {
                link.textContent = displayNumber;
            }
        });
    }
    renderReferencesGrid(refs) {
        const grid = document.querySelector('#references .references-grid');
        if (!grid) return;
        const toSafe = (value) => (value == null ? '' : String(value));

        if (!Array.isArray(refs) || refs.length === 0) {
            grid.innerHTML = `
                <div class="reference-item" data-ref-id="none">
                    <div class="flex items-start">
                        <span class="reference-number">–</span>
                        <div class="flex-1">
                            <div class="reference-title">No references yet</div>
                            <div class="reference-venue">Add entries to <code>assets/data/references.json</code>.</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = refs.map((ref, index) => {
            const id = toSafe(ref.id);
            const title = toSafe(ref.title);
            const authors = toSafe(ref.authors);
            const venue = toSafe(ref.venue);
            const url = toSafe(ref.url);
            const hasUrl = url && url !== '#';
            const targetAttrs = hasUrl ? ' target="_blank" rel="noopener noreferrer"' : '';
            const href = hasUrl ? url : '#';

            const displayNumber = index + 1;

            return `
                <div class="reference-item" data-ref-id="${id}">
                    <div class="flex items-start">
                        <span class="reference-number">${displayNumber}</span>
                        <div class="flex-1">
                            <div class="reference-title">
                                <a class="reference-link" data-ref="${id}" href="${href}"${targetAttrs}>${title}</a>
                            </div>
                            <div class="reference-authors">${authors}</div>
                            <div class="reference-venue">${venue}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Slide-in animation when entering viewport
    initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    const parentSection = entry.target.closest('.section');
                    if (parentSection) parentSection.classList.add('visible');
                    this.updateActiveNavigation();
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -100px 0px' });

        this.sections.forEach(section => observer.observe(section));
    }

    initReferenceAnimations() {
        const referenceItems = document.querySelectorAll('.reference-item');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    const parentSection = entry.target.closest('.section');
                    if (parentSection) parentSection.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        referenceItems.forEach(item => {
            observer.observe(item);
        });
    }

    // Navbar behavior (active link + mobile toggle)
    initNavigation() {
        // Smooth scroll with fixed 80px offset + active state + close sidebar
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href') || '';
                const targetId = href.startsWith('#') ? href.substring(1) : '';
                const targetEl = targetId ? document.getElementById(targetId) : null;
                if (targetEl) {
                    const offset = 80;
                    const top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
                this.navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                this.closeSidebar();
            });
        });

        // Hamburger
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.openSidebar());
        }
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', () => this.closeSidebar());
        }

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeSidebar();
        });

        // Combined scroll handler
        window.addEventListener('scroll', this.throttle(() => {
            this.updateActiveNavigation();
            this.handleNavScrollState();
        }, 100));
        this.handleNavScrollState(); // Set initial state
    }

    openSidebar() {
        if (window.innerWidth <= 1024) {
            this.nav.classList.add('open');
            this.navOverlay.classList.add('show');
            document.body.classList.add('nav-open');
        }
    }

    closeSidebar() {
        this.nav.classList.remove('open');
        this.navOverlay.classList.remove('show');
        document.body.classList.remove('nav-open');
    }

    // Add/remove .nav-scrolled class based on scroll position
    handleNavScrollState() {
        const scrolled = window.scrollY > 50;
        if (scrolled) {
            this.nav.classList.add('nav-scrolled');
        } else {
            this.nav.classList.remove('nav-scrolled');
        }
        // Mirror same state on mobile header for narrow screens
        const mobileHeader = document.getElementById('mobile-header');
        if (mobileHeader) {
            mobileHeader.classList.toggle('nav-scrolled', scrolled);
        }
    }

    updateActiveNavigation() {
        // Pick section whose header is nearest to viewport center
        const centerY = Math.floor(window.innerHeight / 2);
        let bestId = null;
        let bestDist = Infinity;

        this.sections.forEach(section => {
            const header = section.querySelector('.section-title') || section;
            const rect = header.getBoundingClientRect();
            const dist = Math.abs(rect.top - centerY);
            if (dist < bestDist) {
                bestDist = dist;
                bestId = section.getAttribute('id');
            }
        });

        if (!bestId) return;
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === `#${bestId}`);
        });
    }

    // Reference tooltips (show title) and link wiring from JSON
    initReferenceTooltipsAndLinks() {
        const getTitle = (id) => (this.refMap.get(String(id)) || {}).title || `Reference ${id}`;
        const getUrl = (id) => (this.refMap.get(String(id)) || {}).url || '#';

        this.referenceLinks.forEach(link => {
            const refNumber = link.getAttribute('data-ref');
            if (!refNumber) return;

            const isBottomRef = !!link.closest('#references');
            if (isBottomRef) {
                // Bottom reference titles: external link
                link.setAttribute('href', getUrl(refNumber));
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            } else {
                // Inline citations: scroll to card + highlight
                link.setAttribute('href', '#');
                link.removeAttribute('target');
                link.removeAttribute('rel');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToReference(refNumber);
                });
            }

            link.addEventListener('mouseenter', (e) => {
                this.showTooltip(e, getTitle(refNumber));
            });
            link.addEventListener('mouseleave', () => this.hideTooltip());
            link.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
        });

    }

    // Scroll to the N-th reference card and flash highlight (2s)
    scrollToReference(refNumber) {
        const container = document.querySelector('#references .references-grid');
        if (!container) return;
        const target = container.querySelector(`.reference-item[data-ref-id="${String(refNumber)}"]`);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('visible');
        const originalBg = target.style.backgroundColor;
        const originalTransform = target.style.transform;
        target.style.backgroundColor = 'var(--gold-100)';
        target.style.transform = 'scale(1.02)';
        setTimeout(() => {
            target.style.backgroundColor = originalBg || '';
            target.style.transform = originalTransform || '';
        }, 2000);
    }

    // Tooltip helpers
    showTooltip(event, text) {
        if (!this.tooltip) return;
        this.tooltip.textContent = text;
        this.tooltip.classList.add('visible');
        this.updateTooltipPosition(event);
    }

    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip.classList.remove('visible');
    }

    updateTooltipPosition(event) {
        if (!this.tooltip) return;
        this.tooltip.style.left = (event.pageX + 10) + 'px';
        this.tooltip.style.top = (event.pageY - 40) + 'px';
    }

    // Smooth scrolling for internal links (exclude nav items; handled separately with offset)
    initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]:not(#site-nav .nav-item)').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // Particles: gold on hero using particles.js
    initParticlesHero() {
        const containerId = 'particles-hero';
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn('[Particles] container #particles-hero not found');
            return;
        }

        if (typeof particlesJS === 'undefined') {
            console.error('[Particles] particles.js library not loaded');
            return;
        }

        console.log('[Particles] Initializing particles.js...');

        particlesJS(containerId, {
            particles: {
                number: {
                    value: 80,
                    density: { enable: true, value_area: 800 }
                },
                color: { value: '#fbbf24' },
                shape: { type: 'circle' },
                opacity: {
                    value: 0.6,
                    random: true,
                    anim: { enable: true, speed: 1, opacity_min: 0.3, sync: false }
                },
                size: {
                    value: 4,
                    random: true,
                    anim: { enable: true, speed: 2, size_min: 1, sync: false }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#fbbf24',
                    opacity: 0.5,
                    width: 1.5
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 1 } },
                    push: { particles_nb: 4 }
                }
            },
            retina_detect: true
        });

        console.log('[Particles] particles.js initialized successfully!');
    }

    // Hero entrance (right -> left)
    initHeroEntrance() {
        anime({
            targets: '.hero-content > *',
            opacity: [0, 1],
            translateX: [40, 0],
            delay: anime.stagger(180),
            duration: 800,
            easing: 'easeOutQuart'
        });
    }
    // Figure slider (RTHS gallery)
    initFigureSliders() {
        const sliders = document.querySelectorAll('[data-figure-slider]');
        if (!sliders.length) return;

        this.figureSliders = sliders;

        sliders.forEach(slider => {
            const slides = slider.querySelectorAll('.figure-slide');
            if (!slides.length) return;
            const dots = slider.querySelectorAll('.slider-dots .dot');
            let currentIndex = 0;
            let autoTimer = null;

            const showSlide = (targetIndex) => {
                const total = slides.length;
                currentIndex = (targetIndex + total) % total;
                slides.forEach((slide, idx) => {
                    slide.classList.toggle('active', idx === currentIndex);
                });
                dots.forEach((dot, idx) => {
                    const isActive = idx === currentIndex;
                    dot.classList.toggle('active', isActive);
                    dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            };

            const resetAutoCycle = () => {
                if (autoTimer) clearInterval(autoTimer);
                autoTimer = setInterval(() => showSlide(currentIndex + 1), 5000);
            };

            const prevBtn = slider.querySelector('[data-slider-prev]');
            const nextBtn = slider.querySelector('[data-slider-next]');
            if (prevBtn) prevBtn.addEventListener('click', () => {
                showSlide(currentIndex - 1);
                resetAutoCycle();
            });
            if (nextBtn) nextBtn.addEventListener('click', () => {
                showSlide(currentIndex + 1);
                resetAutoCycle();
            });

            dots.forEach((dot, idx) => {
                dot.addEventListener('click', () => {
                    showSlide(idx);
                    resetAutoCycle();
                });
            });

            showSlide(0);
            resetAutoCycle();
            this.adjustSliderCaptionHeight(slider);
        });

        const resizeHandler = this.throttle(() => {
            this.figureSliders.forEach(slider => this.adjustSliderCaptionHeight(slider));
        }, 150);

        window.addEventListener('load', () => {
            this.figureSliders.forEach(slider => this.adjustSliderCaptionHeight(slider));
        });
        window.addEventListener('resize', resizeHandler);
    }

    adjustSliderCaptionHeight(slider) {
        if (!slider) return;
        const captions = slider.querySelectorAll('.figure-highlight-caption');
        if (!captions.length) return;

        let maxHeight = 0;
        captions.forEach(caption => {
            caption.style.minHeight = 'auto';
            const height = caption.offsetHeight;
            if (height > maxHeight) maxHeight = height;
        });

        if (maxHeight > 0) {
            captions.forEach(caption => {
                caption.style.minHeight = `${maxHeight}px`;
            });
        }
    }

    // Utils
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments, context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }
}

// Single application init (avoid duplicates)
window.addEventListener('DOMContentLoaded', () => {
    if (!window.mechWorksApp) {
        window.mechWorksApp = new MechWorksApp();
    }
});

// Loading polish (if any .loader exists)
window.addEventListener('load', () => {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
});
