document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.news-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');
    
    let currentSlide = 0;

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
            slide.classList.remove('active', 'prev-slide');
            
            if (index === currentSlide) {
                slide.classList.add('active');
            } else if (index < currentSlide) {
                slide.classList.add('prev-slide');
            }
            // If index > currentSlide, it drops both classes and sits on the right waiting to slide in
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

    // Event Listeners for Buttons
    nextBtn.addEventListener('click', () => {
        nextSlide();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
    });

});
