// Pastel colors for balloons
const pastelColors = [
  "#FFB6C1", // Light Pink (keep 1 strong pink)
  "#B5EAD7", // Mint
  "#C5C6FF", // Periwinkle
  "#FFF5BA", // Soft Yellow
  "#E0BBE4", // Lavender
  "#AEC6CF", // Pastel Blue
  "#D5E8D4", // Light Sage
  "#FFE5B4", // Apricot (warmer peach replacement)
];

// Balloon size constants
const REGULAR_BALLOON_MIN_WIDTH = 60;
const REGULAR_BALLOON_MIN_HEIGHT = 80;
const REGULAR_BALLOON_MAX_WIDTH = 75;
const REGULAR_BALLOON_MAX_HEIGHT = 100;

const PHOTO_BALLOON_MIN_WIDTH = 30;
const PHOTO_BALLOON_MIN_HEIGHT = 45;
const PHOTO_BALLOON_MAX_WIDTH = 50;
const PHOTO_BALLOON_MAX_HEIGHT = 70;

let balloonInterval = 2000; // default 0.5s in ms
let timerA, timerB;

const balloonCache = [];
const BALLOON_FOLDER = 'EncryptedPhotos/Balloons';
const BALLOON_INDEX_FILE = `${BALLOON_FOLDER}/index.json`;

// Balloon counter tracking
let photoBalloonCount = 0;
const BALLOON_UNLOCK_THRESHOLD = 15; // Game completes at 15 photo balloons
let balloonUnlocked = false;
let gameStarted = false; // Track if card has been opened
let gameCompletionTriggered = false; // Prevent multiple completion calls

// Timers for balanced spawning
let regularBalloonTimer;
let photoBalloonTimer;

function setBalloonInterval(interval){
  balloonInterval = interval;
}

function getBalloonInterval(){
  return balloonInterval;
}

async function preloadBalloonImages() {
  balloonCache.length = 0;

  // Get a list of encrypted balloon image paths
  const encryptedBalloonSources = await fetchEncryptedList(BALLOON_INDEX_FILE, BALLOON_FOLDER);

  for (const path of encryptedBalloonSources) {
    const blob = await decryptImage(path, riddleKey);
    const url = URL.createObjectURL(blob);
    balloonCache.push(url);
  }
}

// Start/Restart based on current settings
function startBalloonTimers() {
  clearInterval(timerA);
  clearInterval(timerB);

  if (!isFinite(balloonInterval)) {
    return; // Don't spawn anything if interval is Infinity
  }

  timerA = setInterval(spawnBalloon, balloonInterval);

  if (allowDualBalloons) {
    timerB = setInterval(() => spawnBalloon(true), balloonInterval * 1.5);
  }
}

// Enhanced spawn rates for game mode (when card is opened)
function startGameBalloonSpawning() {
  // Clear any existing timers
  clearInterval(regularBalloonTimer);
  clearInterval(photoBalloonTimer);
  
  // Spawn regular balloons frequently (every 300ms - 2.5x faster)
  regularBalloonTimer = setInterval(() => spawnBalloon(false, true), 300);
  
  // Spawn photo balloons less frequently (every 1400ms - 2.5x faster) - makes game harder
  photoBalloonTimer = setInterval(() => spawnBalloon(true, true), 1400);
}

// Stop game-mode spawning
function stopGameBalloonSpawning() {
  clearInterval(regularBalloonTimer);
  clearInterval(photoBalloonTimer);
}

function updateBalloonInterval(newSeconds) {
  balloonInterval = newSeconds * 1000;
  startBalloonTimers(); // reapply with new timing
}

function getSliderValueFromInterval(interval) {
  const minLog = Math.log(100);
  const maxLog = Math.log(10000);
  const logInterval = Math.log(interval);
  const scale = (logInterval - minLog) / (maxLog - minLog);
  return 100 - Math.round(scale * 100); // reverse
}

function getIntervalFromSliderValue(value) {
  if (value === 0) return Infinity;

  const minInterval = 100;    // fastest
  const maxInterval = 10000;  // slowest

  // Map slider 1–100 (we avoid 0 for log) to log scale
  const minLog = Math.log(minInterval);
  const maxLog = Math.log(maxInterval);

  const scale = (100 - value) / 100; // reverse slider
  const logInterval = minLog + scale * (maxLog - minLog);

  return Math.exp(logInterval);
}

async function spawnBalloon(useImage = false, isStart = true) {
  const balloon = document.createElement('div');
  balloon.className = 'balloon';
  balloon.style.position = 'absolute';
  balloon.style.transform = 'translateY(-100px)';

  let isPhotoBalloon = false;

  if (useImage && balloonCache.length > 0) {
    const url = balloonCache[Math.floor(Math.random() * balloonCache.length)];
    balloon.style.backgroundImage = `url(${url})`;
    balloon.style.backgroundSize = 'cover';
    balloon.style.backgroundPosition = 'center';
    balloon.style.backgroundRepeat = 'no-repeat';
    balloon.style.minWidth = `${PHOTO_BALLOON_MIN_WIDTH}px`;
    balloon.style.minHeight = `${PHOTO_BALLOON_MIN_HEIGHT}px`;
    balloon.style.maxWidth = `${PHOTO_BALLOON_MAX_WIDTH}px`;
    balloon.style.maxHeight = `${PHOTO_BALLOON_MAX_HEIGHT}px`;
    balloon.style.backgroundColor = 'transparent';
    isPhotoBalloon = true;
  } else {
    balloon.style.backgroundColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
  }

  document.body.appendChild(balloon);

  // Animate floating up using GSAP
  requestAnimationFrame(() => {
    const width = balloon.offsetWidth;
    const maxLeft = window.innerWidth - width;
    const leftPos = Math.random() * maxLeft;
    balloon.style.left = `${leftPos}px`;

    const screenHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);

    balloon.style.top = '0px';
    balloon.style.transform = 'translateY(-100px)';

    gsap.to(balloon, {
      y: screenHeight + 150,
      duration: isStart ? 10 + Math.random() * 15 : 8 + Math.random() * 6,
      ease: 'power1.out',
      onUpdate: function () {
        balloon.style.transform = `translateY(${this.targets()[0]._gsap.y}px)`;
      },
      onComplete: () => balloon.remove()
    });
  });

  // Add pop-on-click and pop-on-touch logic with improved event handling
  function handleBalloonPop(event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Check if balloon hasn't already been clicked (prevent double-counting)
    if (balloon.dataset.clicked === 'true') {
      return;
    }
    balloon.dataset.clicked = 'true';
    
    const pop = new Audio(isPhotoBalloon ? 'Audio/love.mp3' : 'Audio/pop.mp3');
    pop.play();
    
    // Increment counter for photo balloons only
    if (isPhotoBalloon) {
      photoBalloonCount++;
      updateBalloonCounter();
      
      // Check if game should complete (reached 15 photo balloons)
      if (photoBalloonCount >= BALLOON_UNLOCK_THRESHOLD && !gameCompletionTriggered) {
        gameCompletionTriggered = true;
        // Call completeGame from script.js
        if (typeof completeGame === 'function') {
          completeGame();
        }
      }
    }
    
    gsap.to(balloon, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      onComplete: () => balloon.remove()
    });
  }
  
  balloon.addEventListener('click', handleBalloonPop, true);
  balloon.addEventListener('touchstart', handleBalloonPop, { passive: false, capture: true });
}

function updateBalloonCounter() {
  const counterDisplay = document.getElementById('balloon-counter-display');
  const counterMax = document.getElementById('balloon-counter-max');
  if (counterDisplay) {
    counterDisplay.textContent = photoBalloonCount;
    // Update the max display when first called
    if (counterMax && !counterMax.dataset.updated) {
      counterMax.textContent = `/${BALLOON_UNLOCK_THRESHOLD}`;
      counterMax.dataset.updated = 'true';
    }
    // Add visual feedback at milestone
    if (photoBalloonCount === BALLOON_UNLOCK_THRESHOLD) {
      counterDisplay.classList.add('milestone-reached');
    }
  }
}

function handleBalloonUnlock() {
  // App is now fully unlocked
  console.log(`🎉 ${BALLOON_UNLOCK_THRESHOLD} balloons popped! App unlocked!`);
  const counterDisplay = document.getElementById('balloon-counter-display');
  if (counterDisplay) {
    counterDisplay.classList.add('unlocked');
  }
  
  // Advance carousel to show the love message
  nextSlide();
}

function spawnHearts() {
  spawnFallingEmoji(["❤️"]);
}

function spawnFallingFlower() {
  spawnFallingEmoji([
    "🌸", "🌼", "🌻", "🌹", "🌷", "🌺", "💐", "🏵️", "🪷", "🪻", "💮"
  ]);
}

function spawnFallingEmoji(
  emojiArray,
  {
    minFontSize = 20,
    maxFontSize = 40,
    minFallSpeed = 0.5,
    maxFallSpeed = 2.0,
    minSway = -1,
    maxSway = 1,
    opacity = 0.85,
    zIndex = 5
  } = {}
) {
  const emoji = document.createElement("div");
  emoji.textContent = emojiArray[Math.floor(Math.random() * emojiArray.length)];
  emoji.style.position = "fixed";
  emoji.style.top = "-50px";
  emoji.style.fontSize = Math.random() * (maxFontSize - minFontSize) + minFontSize + "px";
  emoji.style.opacity = opacity;
  emoji.style.zIndex = zIndex.toString();
  emoji.style.pointerEvents = 'none';

  const startLeft = Math.random() * window.innerWidth;
  emoji.style.left = `${startLeft}px`;

  document.body.appendChild(emoji);

  let y = -50;
  const fallSpeed = Math.random() * (maxFallSpeed - minFallSpeed) + minFallSpeed;
  const swayAmount = Math.random() * (maxSway - minSway) + minSway;

  const fallInterval = setInterval(() => {
    y += fallSpeed;
    const sway = Math.sin(y / 20) * swayAmount * 5;
    emoji.style.top = `${y}px`;
    emoji.style.left = `${startLeft + sway}px`;

    if (y > window.innerHeight + 50) {
      clearInterval(fallInterval);
      emoji.remove();
    }
  }, 16);
}