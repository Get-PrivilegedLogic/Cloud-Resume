import { CONFIG } from './config.js';

// Add counter animation
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

fetch(CONFIG.API_ENDPOINTS.VISITOR_COUNTER)
  .then(response => response.json())
  .then(data => {
    const visitorCountElement = document.getElementById("visitor-count");
    if (!visitorCountElement) return;

    visitorCountElement.textContent = "0";
    animateValue(visitorCountElement, 0, parseInt(data.count), 1500);

    // Add a glow effect once loaded
    setTimeout(() => {
      const counterContainer = visitorCountElement.closest('.visitor-counter');
      if (counterContainer) {
        counterContainer.style.boxShadow = '0 0 15px rgba(14, 165, 233, 0.6)';
        setTimeout(() => {
          counterContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }, 1000);
      }
    }, 1500);
  })
  .catch(error => {
    console.error("Visitor count failed:", error);
    const visitorCountElement = document.getElementById("visitor-count");
    if (visitorCountElement) visitorCountElement.textContent = "N/A";
  });
