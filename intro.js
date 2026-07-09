document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll-to-Top Button Handler
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 2. Scroll Reveal Observer
    const revealElements = document.querySelectorAll('.scroll-reveal');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        root: null, // Viewport
        threshold: 0.15, // Trigger when 15% is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before it fully enters
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 3. Staggered Grid Items Reveal (Team Section)
    const teamGrid = document.querySelector('.team-grid');
    
    if (teamGrid) {
        const teamMembers = teamGrid.querySelectorAll('.scroll-reveal-item');
        
        const gridCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Stagger the transition of each child item
                    teamMembers.forEach((member, index) => {
                        setTimeout(() => {
                            member.classList.add('visible');
                        }, index * 100); // 100ms delay between each member card
                    });
                    observer.unobserve(entry.target);
                }
            });
        };

        const gridObserver = new IntersectionObserver(gridCallback, {
            root: null,
            threshold: 0.1
        });

        gridObserver.observe(teamGrid);
    }
});
