document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animations to all major sections
    const sections = document.querySelectorAll('h2.section, .experience-card');
    sections.forEach((section, index) => {
        section.classList.add('fade-in');
        section.style.animationDelay = `${index * 0.1}s`;
    });

    // Name color change animation on hover
    const nameElement = document.getElementById('name');
    if (nameElement) {
        nameElement.addEventListener('mouseenter', function() {
            this.style.backgroundImage = 'linear-gradient(45deg, #0ea5e9, #10b981)';
            this.style.backgroundClip = 'text';
            this.style.webkitBackgroundClip = 'text';
            this.style.color = 'transparent';
            this.style.transition = 'all 0.3s ease';
        });

        nameElement.addEventListener('mouseleave', function() {
            this.style.backgroundImage = 'none';
            this.style.color = 'var(--dark)';
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Highlight active navigation link based on scroll position
    const navLinks = document.querySelectorAll('nav a');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: "-80px 0px 0px 0px"
    };
    
    if (navLinks.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('section[id], div[id]').forEach(section => {
            observer.observe(section);
        });
    }
    
    // Scroll to top button functionality
    const scrollTopBtn = document.getElementById('scroll-top');
    
    if (scrollTopBtn) {
        // Show button when user scrolls down 300px
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.style.display = 'block';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        });
        
        // Scroll to top when button is clicked
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
