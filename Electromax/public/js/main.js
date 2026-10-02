document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navLinks && navLinks.classList.contains('active')) {
            if (!event.target.closest('.nav-container')) {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu after clicking a link
                if (navLinks && navLinks.classList.contains('active')) {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    // Add active class to current section on scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link');

    function highlightNavigation() {
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `/#${sectionId}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    // Add error message if it doesn't exist
                    let errorMessage = field.nextElementSibling;
                    if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                        errorMessage = document.createElement('div');
                        errorMessage.className = 'error-message';
                        errorMessage.textContent = 'Este campo es requerido';
                        field.parentNode.insertBefore(errorMessage, field.nextSibling);
                    }
                } else {
                    field.classList.remove('error');
                    const errorMessage = field.nextElementSibling;
                    if (errorMessage && errorMessage.classList.contains('error-message')) {
                        errorMessage.remove();
                    }
                }
            });

            if (!isValid) {
                e.preventDefault();
            }
        });
    });

    // Remove error class on input
    document.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', function() {
            this.classList.remove('error');
            const errorMessage = this.nextElementSibling;
            if (errorMessage && errorMessage.classList.contains('error-message')) {
                errorMessage.remove();
            }
        });
    });

    // Back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Product filtering logic
    const brandFilter = document.getElementById('brand-filter');
    const stateFilter = document.getElementById('state-filter');
    const sortBy = document.getElementById('sort-by');
    const filterButton = document.querySelector('.filter-button');
    const clearFiltersButton = document.querySelector('.clear-filters-button');

    if (filterButton && brandFilter && stateFilter && sortBy) {
        filterButton.addEventListener('click', () => {
            const brand = brandFilter.value;
            const state = stateFilter.value;
            const sort = sortBy.value;

            let queryParams = [];
            if (brand !== 'all') queryParams.push(`brand=${brand}`);
            if (state !== 'all') queryParams.push(`state=${state}`);
            if (sort !== 'recent') queryParams.push(`sort=${sort}`); // Add other sort options as needed

            window.location.href = `/?${queryParams.join('&')}`;
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

    // Set filter values if they are present in the URL (for persistence after filter)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('brand') && brandFilter) {
        brandFilter.value = urlParams.get('brand');
    }
    if (urlParams.has('state') && stateFilter) {
        stateFilter.value = urlParams.get('state');
    }
    if (urlParams.has('sort') && sortBy) {
        sortBy.value = urlParams.get('sort');
    }

    const featuredCarousel = document.querySelector('.featured-carousel');
    if (featuredCarousel) {
        const slides = Array.from(featuredCarousel.querySelectorAll('.carousel-slide'));
        let currentIndex = slides.findIndex(slide => slide.classList.contains('active'));
        if (currentIndex < 0) currentIndex = 0;

        const prevButton = featuredCarousel.querySelector('.carousel-control.prev');
        const nextButton = featuredCarousel.querySelector('.carousel-control.next');

        const showSlide = (index) => {
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('active', slideIndex === index);
            });
        };

        const moveSlide = (direction) => {
            currentIndex = (currentIndex + direction + slides.length) % slides.length;
            showSlide(currentIndex);
        };

        if (prevButton) {
            prevButton.addEventListener('click', () => moveSlide(-1));
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => moveSlide(1));
        }

        let autoPlay = null;
        if (slides.length > 1) {
            autoPlay = setInterval(() => moveSlide(1), 8000);
            featuredCarousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
            featuredCarousel.addEventListener('mouseleave', () => {
                autoPlay = setInterval(() => moveSlide(1), 8000);
            });
        }
    }
}); 