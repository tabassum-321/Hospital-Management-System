// ============================================
// MEDICARE HOSPITAL — MAIN JS
// ============================================

const API = 'http://localhost:5000/api';

// Navbar scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
});

// Hamburger menu
document.getElementById('hamburger')?.addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  navLinks?.classList.toggle('mobile-open');
});

// Contact form
function handleContact(e) {
  e.preventDefault();
  alert('Thank you! We will get back to you soon.');
  e.target.reset();
}

// Animate on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.service-card, .doctor-card, .quick-card, .testi-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.visible').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
});
const styleAnim = document.createElement('style');
styleAnim.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(styleAnim);

// Token helpers
const getToken = () => localStorage.getItem('token');
const getUser  = () => JSON.parse(localStorage.getItem('user') || 'null');
const logout   = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/frontend/index.html'; };

// Auth fetch helper
async function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
}