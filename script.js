let correct = false;

document.addEventListener("DOMContentLoaded", () => {
  const popupModal = document.getElementById("popup-modal");
  const cardWrapper = document.getElementById("card-wrapper");
  const submitBtn = document.getElementById("submit-answer");
  const answerInput = document.getElementById("riddle-answer");
  const feedback = document.getElementById("feedback");

  // Hide main card initially
  cardWrapper.style.display = "none";

  // SHA-256 hash of "peanut" (in hex)
  const correctAnswerHash = "10f3525281a9d1d581d7a8de31af7f64938691f1f50790aeb5de064f02dbfbb8";

  let wrongAttempts = 0;

  // Focus input automatically
  answerInput.focus();

  // Helper: convert ArrayBuffer to hex string
  function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Function to hash user input with SHA-256 and return hex string
  async function hashAnswer(answer) {
    const encoder = new TextEncoder();
    const data = encoder.encode(answer);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
  }

  submitBtn.addEventListener("click", async () => {
    const userAnswer = answerInput.value.trim().toLowerCase();

    // Hash the user answer and compare to stored hash
    const userAnswerHash = await hashAnswer(userAnswer);

    if (userAnswerHash === correctAnswerHash) {
      // Correct - hide popup, show card
      popupModal.style.display = "none";
      cardWrapper.style.display = "flex";
      bgMusic.play();
      for (let i = 0; i < 100; i++) {
        spawnBalloon(false, false);
      }
      document.getElementById("balloonSliderContainer").style.display = "block";
      document.getElementById("balloonSlider").value = getSliderValueFromInterval(balloonInterval);
      startBalloonTimers();
      correct = true;
    } else {
      // Incorrect
      wrongAttempts++;
      if (wrongAttempts === 1) {
        feedback.textContent = "You can do better than that. Try again for a hint.";
      } else if (wrongAttempts === 2) {
        feedback.textContent = "Hint: Her aroma is always in the air!";
      } else {
        feedback.textContent = "Hint: Her smell in the morning.";
      }
      answerInput.value = "";
      answerInput.focus();
    }
  });

  // Optional: Allow pressing Enter to submit
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
});


const card = document.getElementById("card");
const bgMusic = document.getElementById("bg-music");
let cardOpen = false;
let cardOpened = false;

// Card flip on swipe or drag
let startX = 0;

function handleStart(e) {
  startX = e.touches ? e.touches[0].clientX : e.clientX;
}

function handleMove(e) {

  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const diffX = currentX - startX;
    if (!correct){
    return;
  }
  if (!cardOpen && diffX < -50) {
    card.classList.add("open");
    cardOpen = true;
    for (let i = 0; i < 30; i++) {
        spawnBalloon(true);
      }
    if (!cardOpened) {
      cardOpened = true;
      allowDualBalloons = true;
      updateBalloonInterval(1.5);
      document.getElementById("balloonSlider").value = getSliderValueFromInterval(balloonInterval);
      setInterval(spawnFallingFlower, 1000);
    }
  } else if (cardOpen && diffX > 50) {
    card.classList.remove("open");
    cardOpen = false;
    for (let i = 0; i < 40; i++) {
        spawnFallingFlower();
      }
  }
}

document.addEventListener("mousedown", handleStart);
document.addEventListener("mousemove", handleMove);
document.addEventListener("touchstart", handleStart);
document.addEventListener("touchmove", handleMove);

// Pastel colors for balloons
const pastelColors = [
  "#FFB6C1", // Light Pink
  "#FFDAB9", // Peach Puff
  "#FFFACD", // Lemon Chiffon
  "#E0BBE4", // Lavender
  "#FF69B4", // Hot Pink
  "#FFCCCB", // Soft Coral
  "#FADADD", // Misty Rose
  "#B5EAD7", // Mint
  "#C5C6FF", // Periwinkle
  "#FFF5BA"  // Soft Yellow
];

let balloonInterval = 500; // default 0.5s in ms
let timerA, timerB;
let allowDualBalloons = false;

const balloonSlider = document.getElementById("balloonSlider");

// Prevent touch from reaching card logic
balloonSlider.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
balloonSlider.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
balloonSlider.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });

// Same for mouse (desktop)
balloonSlider.addEventListener("mousedown", (e) => e.stopPropagation());
balloonSlider.addEventListener("mousemove", (e) => e.stopPropagation());
balloonSlider.addEventListener("mouseup", (e) => e.stopPropagation());

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

document.getElementById("balloonSlider").addEventListener("input", function () {
  const sliderValue = parseInt(this.value);
  balloonInterval = getIntervalFromSliderValue(sliderValue);
  startBalloonTimers();
});

function spawnBalloon(useImage = false, isCorrect = true) {
  const balloon = document.createElement('div');
  balloon.className = 'balloon';
  balloon.style.position = 'absolute';
  balloon.style.top = '-100px'; // Start just above the screen

  if (useImage) {
    const imageSources = [
  'IMG_2559.jpeg',
  'IMG_2932.jpeg',
  'IMG_3022.jpeg',
  'IMG_3096.jpeg',
  'IMG_3148.jpeg',
  'IMG_7159.jpeg',
  'IMG_3063.jpeg',
  'IMG_2646.jpeg',
  'IMG_2665.jpeg',
  'IMG_2889.jpeg',
  'IMG_3073.jpeg',
  'IMG_7170.jpeg'
];
    balloon.style.backgroundImage = `url(${imageSources[Math.floor(Math.random() * imageSources.length)]})`;
    balloon.style.backgroundSize = 'cover';
    balloon.style.backgroundPosition = 'center';
    balloon.style.backgroundRepeat = 'no-repeat';
    balloon.style.minWidth = '80px';
    balloon.style.minHeight = '110px';
    balloon.style.maxWidth = '120px';
    balloon.style.maxHeight = '160px';
    balloon.style.backgroundColor = 'transparent'; // no background color
  } else {
    balloon.style.backgroundColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
  }
 document.body.appendChild(balloon);

  // Use requestAnimationFrame to ensure styles are applied first
  requestAnimationFrame(() => {
    const width = balloon.offsetWidth;
    const maxLeft = window.innerWidth - width;
    const leftPos = Math.random() * maxLeft;

    balloon.style.left = `${leftPos}px`;

    const screenHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
  
    gsap.to(balloon, {
      y: screenHeight + 150, // Fall well past the screen bottom
      duration: isCorrect ? 6 + Math.random() * 20 : 5 + Math.random()*8, // Short duration if incorrect
      ease: 'power1.out',
      onComplete: () => {
        balloon.remove();
      }
    });
  });

  balloon.addEventListener('click', () => {
    let pop;
    if (balloon.style.backgroundColor == 'transparent'){
      pop = new Audio('love.mp3');
    }
    else{
      pop = new Audio('pop.mp3');
    }
    pop.play();
    gsap.to(balloon, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => balloon.remove() });
  });
}


function spawnFallingFlower() {
  const flower = document.createElement("div");
  flower.textContent = [
  "🌸", "🌼", "🌻", "🌹", "🌷", "🌺", "💐", "🏵️",
  "🪷", "🪻", "💮"
][Math.floor(Math.random() * 6)];
  flower.style.position = "fixed";
  flower.style.top = "-50px";
  flower.style.fontSize = Math.random() * 20 + 20 + "px";
  flower.style.opacity = 0.8;
  flower.style.zIndex = "5";
  flower.style.pointerEvents = 'none';

  // Set starting left in pixels based on viewport width
  const startLeft = Math.random() * window.innerWidth;
  flower.style.left = `${startLeft}px`;

  document.body.appendChild(flower);

  let y = -50;
  const fallSpeed = Math.random() * 1.5 + 0.5;
  const swayAmount = Math.random() * 2 - 1;

  const fallInterval = setInterval(() => {
    y += fallSpeed;
    const sway = Math.sin(y / 20) * swayAmount * 5;
    flower.style.top = `${y}px`;
    flower.style.left = `${startLeft + sway}px`;

    if (y > window.innerHeight + 50) {
      clearInterval(fallInterval);
      flower.remove();
    }
  }, 16);
}