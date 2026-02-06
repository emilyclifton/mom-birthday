// Game state
const foundCats = new Set();
const totalCats = 6;

// DOM elements
const caption = document.getElementById('caption');
const captionText = caption.querySelector('.caption-text');
const endScreen = document.getElementById('endScreen');
const confettiContainer = document.getElementById('confetti');
const foundCountDisplay = document.querySelector('.found-count');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Meow sound using Web Audio API (no external file needed)
let audioContext;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playMeow() {
    const ctx = getAudioContext();
    
    // Resume audio context if suspended (required for iOS)
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // Main meow tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.25);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.15, now + 0.25);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.4);
    
    // Add harmonics for more realistic sound
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(800, now + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.05, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(now);
    osc2.stop(now + 0.4);
}

// Play a rustle sound when bush moves
function playRustle() {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    const now = ctx.currentTime;
    
    // White noise for rustle
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.3);
}

// Handle bush click - slide it aside to reveal the cat
function handleBushClick(event) {
    const bush = event.currentTarget;
    const catId = bush.dataset.reveals;
    
    // Don't process if already moved
    if (bush.classList.contains('moved')) {
        return;
    }
    
    // Play rustle sound
    playRustle();
    
    // Move the bush aside
    bush.classList.add('moved');
    
    // Reveal the associated cat
    const cat = document.querySelector(`.cat[data-cat="${catId}"]`);
    if (cat) {
        // Small delay for dramatic effect
        setTimeout(() => {
            cat.classList.add('revealed');
        }, 300);
    }
}

// Handle cat click
function handleCatClick(event) {
    const cat = event.currentTarget;
    const catId = cat.dataset.cat;
    const message = cat.dataset.message;
    
    // Don't process if already found or not revealed
    if (foundCats.has(catId) || !cat.classList.contains('revealed')) {
        return;
    }
    
    // Play meow sound
    playMeow();
    
    // Mark as found
    foundCats.add(catId);
    cat.classList.add('found');
    
    // Update progress
    foundCountDisplay.textContent = foundCats.size;
    
    // Show caption
    showCaption(message);
    
    // Check if all cats found
    if (foundCats.size === totalCats) {
        setTimeout(showEndScreen, 2000);
    }
}

// Show caption popup
function showCaption(message) {
    captionText.textContent = `"${message}"`;
    caption.classList.add('show');
    
    // Hide caption after delay
    setTimeout(() => {
        caption.classList.remove('show');
    }, 2500);
}

// Show end screen with confetti
function showEndScreen() {
    endScreen.classList.add('show');
    createConfetti();
}

// Create confetti animation
function createConfetti() {
    const colors = ['#ff69b4', '#ffd700', '#ff6b6b', '#9c27b0', '#4caf50', '#2196f3', '#ff9800'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 3) + 's';
        
        // Random shapes
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
            confetti.style.width = '12px';
            confetti.style.height = '12px';
        }
        
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
    
    // Continue creating confetti periodically
    setTimeout(createConfetti, 3000);
}

// Background music
let musicPlaying = false;
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

function startMusic() {
    if (bgMusic && !musicPlaying) {
        bgMusic.volume = 0.3;
        bgMusic.play().then(() => {
            musicPlaying = true;
            updateMusicButton();
        }).catch(err => {
            console.log('Music autoplay blocked:', err);
        });
    }
}

function toggleMusic() {
    if (!bgMusic) return;
    
    if (musicPlaying) {
        bgMusic.pause();
        musicPlaying = false;
    } else {
        bgMusic.play();
        musicPlaying = true;
    }
    updateMusicButton();
}

function updateMusicButton() {
    if (musicToggle) {
        musicToggle.textContent = musicPlaying ? '🔊' : '🔇';
    }
}

// Start the game (called when start button is clicked)
function startGame() {
    // Hide the start screen
    if (startScreen) {
        startScreen.classList.add('hidden');
    }
    
    // Start the music immediately
    startMusic();
}

// Initialize game
function init() {
    // Start button click handler
    if (startButton) {
        startButton.addEventListener('click', startGame);
    }
    
    // Add click listeners to all bushes
    const bushes = document.querySelectorAll('.bush[data-reveals]');
    bushes.forEach(bush => {
        bush.addEventListener('click', handleBushClick);
        bush.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleBushClick({ currentTarget: bush });
        });
    });
    
    // Add click listeners to all cats
    const cats = document.querySelectorAll('.cat');
    cats.forEach(cat => {
        cat.addEventListener('click', handleCatClick);
        cat.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleCatClick({ currentTarget: cat });
        });
    });
    
    // Music toggle button
    if (musicToggle) {
        musicToggle.addEventListener('click', toggleMusic);
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
