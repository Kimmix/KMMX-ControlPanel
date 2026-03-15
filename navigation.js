// Floating Navigation Handler
document.addEventListener('DOMContentLoaded', function () {
    const navIcons = document.querySelectorAll('.nav-icon');
    const pages = document.querySelectorAll('.page');

    // Navigation click handler
    navIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const targetPage = this.getAttribute('data-page');

            // Vibrate on navigation
            if (typeof vibrateDevice === 'function') {
                vibrateDevice();
            }

            // Remove active class from all nav icons
            navIcons.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked nav icon
            this.classList.add('active');

            // Hide all pages
            pages.forEach(page => page.classList.remove('active'));

            // Show target page
            const targetPageElement = document.getElementById(`page-${targetPage}`);
            if (targetPageElement) {
                targetPageElement.classList.add('active');
            }
        });
    });
});

