document.addEventListener('DOMContentLoaded', () => {
    // 1. Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // 2. Query DOM Elements
    const wrapper = document.querySelector('.scroll-content-wrapper');
    const outer = document.querySelector('.scroll-container-outer');
    const scrollSurface = document.querySelector('.parchment-scroll-surface');

    // 3. Helper: Prepare all SVG paths for stroke drawing animation
    const initializeSVGPaths = () => {
        const paths = document.querySelectorAll(
            'path.draw-path, path.draw-path-staggered, path.shade-path, path.face-outline, path.features, path.sketch-frame, path.border-corner, path.trans-path'
        );
        paths.forEach(path => {
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
        });
    };
    initializeSVGPaths();

    // 4. Calculate total horizontal scrollable width
    const getScrollAmount = () => {
        return wrapper.scrollWidth - window.innerWidth;
    };

    // 5. Initialize Main GSAP Horizontal Scroll Pinning Tween
    const scrollTween = gsap.to(wrapper, {
        x: () => -getScrollAmount(),
        ease: 'none',
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: () => '+=' + getScrollAmount(),
            pin: '.scroll-container-outer',
            scrub: 0.8, // Smoothly tracks scrollwheel/trackpad
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                // Update Brass Ruler Slider Position (percentage 0 to 100)
                const pct = self.progress * 100;
                gsap.set('.brass-cursor-indicator', { left: `${pct}%` });

                // Unroll Left parchment cylinder (90px -> 24px in first 15% scroll)
                const leftProgress = Math.min(1, self.progress / 0.15);
                const leftRollWidth = gsap.utils.mapRange(0, 1, 90, 24, leftProgress);
                gsap.set('.left-roll', { width: leftRollWidth });

                // Roll up Right PCB cylinder (24px -> 90px in last 15% scroll)
                const rightProgress = Math.max(0, (self.progress - 0.85) / 0.15);
                const rightRollWidth = gsap.utils.mapRange(0, 1, 24, 90, rightProgress);
                gsap.set('.right-roll', { width: rightRollWidth });

                // ShapeGrid Canvas Opacity transition (0 -> 0.30 between 55% and 80% scroll)
                const shapeGridProgress = gsap.utils.clamp(0, 1, (self.progress - 0.55) / 0.25);
                const canvasOpacity = gsap.utils.mapRange(0, 1, 0, 0.35, shapeGridProgress);
                gsap.set('#intro-shapegrid-canvas', { opacity: canvasOpacity });

                // Shimmering David Blackwell Equation 3 as digital boundary nears (55% scroll)
                const eq3 = document.querySelector('.eq-3');
                if (eq3) {
                    if (self.progress > 0.55) {
                        eq3.classList.add('shimmering');
                    } else {
                        eq3.classList.remove('shimmering');
                    }
                }
            }
        }
    });

    // 6. Hook up Brass Ruler clicks to jump to corresponding scroll position
    const ruler = document.querySelector('.brass-ruler');
    if (ruler) {
        ruler.addEventListener('click', (e) => {
            const rect = ruler.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            const scrollPos = pct * getScrollAmount();
            window.scrollTo({
                top: scrollPos,
                behavior: 'smooth'
            });
        });
    }

    // 7. Beat 1 Reveal: Run immediately or on very slight scroll
    const revealBeat1 = () => {
        const beat1Paths = document.querySelectorAll('#section1 .draw-path, #section1 .draw-path-staggered');
        gsap.to(beat1Paths, {
            strokeDashoffset: 0,
            duration: 1.8,
            stagger: 0.12,
            ease: 'power2.out'
        });
        
        gsap.from('.wax-seal', {
            scale: 0,
            rotation: -90,
            duration: 1.2,
            ease: 'back.out(1.7)',
            delay: 0.5
        });

        gsap.from('.mono-tag', {
            opacity: 0,
            x: -20,
            duration: 1,
            delay: 1.2
        });

        gsap.from('.write-on-text', {
            opacity: 0,
            y: 30,
            duration: 1.2,
            delay: 0.8,
            ease: 'power3.out'
        });
    };
    
    // Trigger Beat 1 shortly after load
    setTimeout(revealBeat1, 500);

    // 8. Beat 2 Reveal: Team Sketching
    const portraitCards = document.querySelectorAll('.portrait-card');
    portraitCards.forEach((card, index) => {
        const cardPaths = card.querySelectorAll('.draw-path, .face-outline, .features');
        const shadePaths = card.querySelectorAll('.shade-path');
        const textElements = card.querySelectorAll('.member-name-ink, .member-id-ink');

        gsap.timeline({
            scrollTrigger: {
                trigger: card,
                containerAnimation: scrollTween,
                start: 'left 85%', // Triggers as card slides in from right
                toggleActions: 'play none none none'
            }
        })
        .to(card, { opacity: 1, y: 0, duration: 0.6 })
        .to(cardPaths, { strokeDashoffset: 0, duration: 1.5, stagger: 0.1, ease: 'sine.out' }, '-=0.4')
        .to(shadePaths, { strokeDashoffset: 0, duration: 1.0, stagger: 0.05, ease: 'power1.out' }, '-=0.8')
        .from(textElements, { opacity: 0, y: 10, duration: 0.8, stagger: 0.1 }, '-=0.6');
    });

    // Also animate the Team Header
    gsap.timeline({
        scrollTrigger: {
            trigger: '.team-header-container',
            containerAnimation: scrollTween,
            start: 'left 85%'
        }
    })
    .to('.woodcut-crest .draw-path', { strokeDashoffset: 0, duration: 1.5 })
    .from('.crest-overlay-logo', { scale: 0, opacity: 0, duration: 1.0, ease: 'back.out(1.5)' }, '-=0.8')
    .from('.team-titles', { opacity: 0, x: -30, duration: 1.0 }, '-=0.8');

    // 9. Beat 3 Reveal: David Blackwell Card
    const borderPaths = document.querySelectorAll('.knotwork-border-svg .draw-path, .knotwork-border-svg .border-corner');
    const vipContentElements = document.querySelectorAll('.vip-frame-container, .vip-biography, .marginal-equation');

    gsap.timeline({
        scrollTrigger: {
            trigger: '.vip-container-card',
            containerAnimation: scrollTween,
            start: 'left 75%'
        }
    })
    .to(borderPaths, { strokeDashoffset: 0, duration: 2.0, stagger: 0.15, ease: 'power2.out' })
    .from(vipContentElements, { opacity: 0, y: 30, duration: 1.2, stagger: 0.15, ease: 'power3.out' }, '-=1.5');

    // David Blackwell 3D Hover Tilt Effect
    const vipCard = document.querySelector('.vip-container-card');
    if (vipCard) {
        vipCard.addEventListener('mousemove', (e) => {
            const rect = vipCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = -(y - centerY) / 25; // max tilt ~10 degrees
            const rotateY = (x - centerX) / 30;

            gsap.to(vipCard, {
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        vipCard.addEventListener('mouseleave', () => {
            gsap.to(vipCard, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    }

    // 10. Beat 4 Reveals: Agentic AI digitizing transitions
    // Transition background lines: ink lines draw first, then circuit lines
    const transPaths = document.querySelectorAll('.bg-transition-lines .trans-path');
    gsap.timeline({
        scrollTrigger: {
            trigger: '.concept-container-card',
            containerAnimation: scrollTween,
            start: 'left 75%'
        }
    })
    .to(transPaths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.08, ease: 'power1.out' });



    // Trigger Tally checkmarks checkbox ticks on scroll
    const tallyItems = document.querySelectorAll('.tally-item');
    tallyItems.forEach((item, index) => {
        ScrollTrigger.create({
            trigger: item,
            containerAnimation: scrollTween,
            start: 'left 55%',
            onEnter: () => {
                item.classList.add('digitized');
            }
        });
    });

    // 11. Rewind/Scroll-to-top handler
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 12. Scribe Scroll Prompt Nudge
    // Wait 2s, if page hasn't scrolled, scroll slightly to demonstrate horizontal action
    setTimeout(() => {
        if (window.scrollY === 0) {
            window.scrollTo({
                top: 150,
                behavior: 'smooth'
            });
            setTimeout(() => {
                if (window.scrollY === 150) {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }, 1200);
        }
    }, 2000);

    // 13. Initialize ShapeGrid Background on Canvas
    const canvas = document.getElementById('intro-shapegrid-canvas');
    if (canvas) {
        new ShapeGrid(canvas, {
            speed: 0.4,
            squareSize: 50,
            direction: 'diagonal',
            borderColor: 'rgba(124, 77, 255, 0.1)',
            hoverFillColor: 'rgba(124, 77, 255, 0.15)',
            shape: 'hexagon',
            hoverTrailAmount: 8
        });
    }
});
