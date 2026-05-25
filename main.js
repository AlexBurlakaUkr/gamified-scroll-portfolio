/**
 * Gamified Scroll Portfolio - Main Logic
 * Role: Expert Frontend Developer
 * Single Responsibility Principle compliance: Input/Scroll tracking and UI rendering separated.
 */

// Simple i18n Localization Dictionary
const translations = {
  en: {
    heroLevel: "Level 1 Developer",
    loading: "Loading Hero Profile...",
    timelineTitle: "Quest Log: Completed Games",
    playButtonText: "Launch Game"
  }
};

/**
 * Retrieves localized string based on a key.
 * @param {string} key - The dictionary key.
 * @param {string} locale - The target locale (defaults to 'en').
 * @returns {string} The localized string.
 */
function getTranslation(key, locale = "en") {
  if (translations[locale] && translations[locale][key]) {
    return translations[locale][key];
  }
  return key;
}

/**
 * Dynamically injects the Hero section content from portfolioData.
 */
function injectHeroContent() {
  const heroCard = document.getElementById('hero-content');
  if (!heroCard) {
    console.error("Critical Failure: Element #hero-content not found in the DOM.");
    return;
  }

  // Check if portfolioData is loaded
  if (typeof portfolioData === 'undefined') {
    console.error("Critical Failure: portfolioData is not loaded. Make sure config.js is loaded first.");
    heroCard.innerHTML = `<div class="error-message">Failed to load portfolio configurations.</div>`;
    return;
  }

  const { developerName, specialization, heroSubtitle } = portfolioData;

  // Set the structural markup of the hero card using key-based localization where applicable
  heroCard.innerHTML = `
    <div class="level-badge">${getTranslation('heroLevel')}</div>
    <h1 class="hero-name">${developerName}</h1>
    <div class="hero-spec">
      <span class="spec-symbol">◆</span>
      <span class="spec-text">${specialization}</span>
      <span class="spec-symbol">◆</span>
    </div>
    <p class="hero-subtitle">${heroSubtitle}</p>
  `;
}

/**
 * Dynamically renders the games timeline from portfolioData.games.
 */
function injectTimeline() {
  const timelineSection = document.getElementById('games-timeline');
  if (!timelineSection) {
    console.error("Critical Failure: Element #games-timeline not found in the DOM.");
    return;
  }

  if (typeof portfolioData === 'undefined' || !portfolioData.games) {
    console.error("Critical Failure: portfolioData.games is missing.");
    return;
  }

  let htmlContent = `
    <div class="timeline-title-container">
      <h2 class="timeline-main-title">${getTranslation('timelineTitle')}</h2>
    </div>
  `;

  portfolioData.games.forEach((game, index) => {
    // Generate a unique fallback gradient based on index so the card looks gorgeous
    // even if the cover images are not loaded yet (strict whiteboxing)
    const hue = (index * 55) % 360;
    const cardBgGradient = `linear-gradient(135deg, hsl(${hue}, 45%, 12%), hsl(${(hue + 40) % 360}, 50%, 4%))`;
    const levelNumber = String(index + 1).padStart(2, '0');

    htmlContent += `
      <div class="timeline-item" id="game-item-${index}">
        <div class="timeline-node" id="game-node-${index}">
          <div class="node-pulse"></div>
        </div>
        <div class="timeline-card-wrapper">
          <div class="game-card" id="game-card-${index}">
            <div class="game-card-bg" style="background: ${cardBgGradient};"></div>
            <img class="game-card-img" src="${game.imagePath}" alt="${game.title}" onerror="this.style.opacity='0';">
            <div class="game-card-overlay"></div>
            <div class="game-card-content">
              <span class="game-level-tag">LEVEL ${levelNumber}</span>
              <h3 class="game-card-title">${game.title}</h3>
              <p class="game-card-description">${game.description}</p>
              <a href="${game.playLink}" target="_blank" rel="noopener noreferrer" class="game-play-btn">
                <span>${getTranslation('playButtonText')}</span>
                <span class="btn-arrow">▶</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  timelineSection.innerHTML = htmlContent;
}

// Throttle variable for performance optimization
let isUpdating = false;

/**
 * Calculates scroll percentage and updates the scrolling avatar
 * and active path progress indicator dynamically.
 * Additionally checks intersection of the scrolling avatar with timeline nodes.
 */
function updateScrollEffects() {
  const pathActiveLine = document.getElementById('path-active-line');
  const avatar = document.getElementById('avatar');
  
  if (!pathActiveLine || !avatar) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight;
  const winHeight = window.innerHeight;
  const scrollable = docHeight - winHeight;

  // Handle case where document is not scrollable
  const scrollPercent = scrollable > 0 ? scrollTop / scrollable : 0;

  // Define avatar's viewport bounding track (15vh to 85vh)
  const startVh = 15;
  const endVh = 85;
  const currentVh = startVh + (endVh - startVh) * scrollPercent;

  // Set the avatar's position in the viewport
  avatar.style.top = `${currentVh}vh`;

  // Calculate the avatar's exact absolute position relative to the document
  const avatarViewportPixels = (currentVh / 100) * winHeight;
  const avatarAbsoluteTop = scrollTop + avatarViewportPixels;

  // Update the height of the illuminated active line path
  pathActiveLine.style.height = `${avatarAbsoluteTop}px`;

  // Add micro-animation: spin the avatar ring as user scrolls
  const rotationDegrees = scrollPercent * 360;
  avatar.style.transform = `translate(-50%, -50%) rotate(${rotationDegrees}deg)`;

  // --- Timeline Node Activation Logic ---
  const timelineItems = document.querySelectorAll('.timeline-item');
  timelineItems.forEach((item, index) => {
    const node = item.querySelector('.timeline-node');
    const card = item.querySelector('.game-card');
    if (!node || !card) return;

    // Calculate node's absolute vertical center in the document
    const nodeRect = node.getBoundingClientRect();
    const nodeAbsoluteTop = scrollTop + nodeRect.top + nodeRect.height / 2;

    // Proximity activation offset (25% of viewport height)
    // This allows the card/node to activate earlier, when the avatar approaches the checkpoint,
    // ensuring the animation finishes while the card is in the comfortable lower-middle viewport area.
    const proximityOffset = winHeight * 0.25;

    // Trigger state modification if the scrolling avatar's sensory field reaches the node
    if (avatarAbsoluteTop + proximityOffset >= nodeAbsoluteTop) {
      item.classList.add('passed');
      item.classList.add('active');
      card.classList.add('active');
    } else {
      item.classList.remove('passed');
      item.classList.remove('active');
      card.classList.remove('active');
    }
  });
}

/**
 * Throttled handler for page scrolling and viewport resizing.
 */
function handleScrollAndResize() {
  if (!isUpdating) {
    window.requestAnimationFrame(() => {
      updateScrollEffects();
      isUpdating = false;
    });
    isUpdating = true;
  }
}

// Initialize components and bind event listeners
window.addEventListener('DOMContentLoaded', () => {
  injectHeroContent();
  injectTimeline();
  updateScrollEffects();
});

window.addEventListener('scroll', handleScrollAndResize, { passive: true });
window.addEventListener('resize', handleScrollAndResize, { passive: true });
