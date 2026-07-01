document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.intro-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');
    
    let currentSlide = 0;
    let autoSlideInterval;
    const SLIDE_DELAY = 6000; // 6 seconds for intro slides because they contain more text

    // Initialize dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    function updateSlides() {
        slides.forEach((slide, index) => {
            // Remove active and prev states initially
            slide.classList.remove('active', 'prev-slide');
            
            if (index === currentSlide) {
                slide.classList.add('active');
            } else if (index < currentSlide) {
                slide.classList.add('prev-slide');
            }
            // Automatically, if index > currentSlide, it drops both and sits right (default state)
        });

        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        currentSlide++;
        if (currentSlide >= slides.length) {
            currentSlide = 0; // Loop back
        }
        updateSlides();
    }

    function prevSlide() {
        currentSlide--;
        if (currentSlide < 0) {
            currentSlide = slides.length - 1; // Loop to end
        }
        updateSlides();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlides();
    }

    // Event Listeners for Nav Buttons
    nextBtn.addEventListener('click', () => {
        nextSlide();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
    });
});
