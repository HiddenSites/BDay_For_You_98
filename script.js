let correct = false;
let allowDualBalloons = false;
let riddleKey; // global key once solved
let balloonInteraction = false;
// SHA-256 hash (in hex)
const correctAnswerHash = "10f3525281a9d1d581d7a8de31af7f64938691f1f50790aeb5de064f02dbfbb8";

function generateRosettes(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`No element found with ID: ${containerId}`);
    return;
  }

  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    span.className = "rosette";
    container.appendChild(span);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const popupModal = document.getElementById("popup-modal");
  const cardWrapper = document.getElementById("card-wrapper");
  const submitBtn = document.getElementById("submit-answer");
  const answerInput = document.getElementById("riddle-answer");
  const feedback = document.getElementById("feedback");

  // Hide main card initially
  cardWrapper.style.display = "none";

  let wrongAttempts = 0;

  // Focus input automatically
  answerInput.focus();

  submitBtn.addEventListener("click", async () => {
    const userAnswer = answerInput.value.trim().toLowerCase();

    // Hash the user answer and compare to stored hash
    const userAnswerHash = await hashAnswer(userAnswer);

    if (userAnswerHash === correctAnswerHash) {
      riddleKey = await deriveDecryptionKey(userAnswer);

      // Correct - hide popup, show card
      popupModal.style.display = "none";

      generateRosettes("rosettes3", 13);
      generateRosettes("rosettes2", 18);
      generateRosettes("rosettes1", 23);

      cardWrapper.style.display = "flex";
      bgMusic.play();
      document.getElementById("balloonSliderContainer").style.display = "block";
      document.getElementById("balloonSlider").value = getSliderValueFromInterval(getBalloonInterval());
      correct = true;
      startBalloonTimers(); // Start spawning balloons on the front
      await preloadBalloonImages();
      await preloadCarouselImages(); 
      await renderCarousel();
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
let gameCompleted = false; // Track if game has been completed

// Card flip on swipe or drag
let startX = 0;
let touchOnBalloon = false;

function handleStart(e) {
  startX = e.touches ? e.touches[0].clientX : e.clientX;
  // Check if touch started on a balloon
  const touchTarget = e.touches ? document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) : e.target;
  touchOnBalloon = touchTarget && touchTarget.classList && touchTarget.classList.contains('balloon');
}

// Function to complete the game and slow down balloons
function completeGame() {
  gameCompleted = true;
  
  // Stop the game spawning timers to reduce balloon count
  stopGameBalloonSpawning();
  
  // Set to very low speed (8 seconds between balloons)
  updateBalloonInterval(8);
  document.getElementById("balloonSlider").value = getSliderValueFromInterval(getBalloonInterval());
  
  // Hide the GO button
  const goButton = document.getElementById("game-start-button");
  if (goButton) {
    goButton.classList.add("hidden");
  }
  
  // Advance to the next carousel message
  if (typeof nextSlide === 'function') {
    nextSlide();
  }
}

// Function to start the game from GO button
function startGameFromButton() {
  // Hide GO button
  const goButton = document.getElementById("game-start-button");
  if (goButton) {
    goButton.classList.add("hidden");
  }
  
  // Show counter
  const counterElement = document.getElementById('balloon-counter');
  if (counterElement) {
    counterElement.classList.add('visible');
  }
  
  // Stop the regular slider-controlled timers
  clearInterval(timerA);
  clearInterval(timerB);
  
  // Start the enhanced game-mode spawning
  startGameBalloonSpawning();
  
  // Set faster balloon interval
  updateBalloonInterval(1.8);
  document.getElementById("balloonSlider").value = getSliderValueFromInterval(getBalloonInterval());
}

function handleMove(e) {

  if (balloonInteraction) return;

  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const diffX = currentX - startX;
  
  // Don't open/close card if interacting with a balloon
  if (touchOnBalloon) {
    return;
  }
  
  if (!correct){
    return;
  }
  if (!cardOpen && diffX < -50) {
    card.classList.add("open");
    cardOpen = true;
  } else if (cardOpen && diffX > 50) {
    card.classList.remove("open");
    cardOpen = false;
  }
}

document.addEventListener("mousedown", handleStart);
document.addEventListener("mousemove", handleMove);
document.addEventListener("touchstart", handleStart);
document.addEventListener("touchmove", handleMove);

// ✅ RESET FLAG
document.addEventListener("touchend", () => {
  balloonInteraction = false;
});

document.addEventListener("mouseup", () => {
  balloonInteraction = false;
});

const balloonSlider = document.getElementById("balloonSlider");

// Prevent touch from reaching card logic
balloonSlider.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
balloonSlider.addEventListener("touchmove", (e) => e.stopPropagation(), { passive: true });
balloonSlider.addEventListener("touchend", (e) => e.stopPropagation(), { passive: true });

// Same for mouse (desktop)
balloonSlider.addEventListener("mousedown", (e) => e.stopPropagation());
balloonSlider.addEventListener("mousemove", (e) => e.stopPropagation());
balloonSlider.addEventListener("mouseup", (e) => e.stopPropagation());

document.getElementById("balloonSlider").addEventListener("input", function () {
  const sliderValue = parseInt(this.value);
  setBalloonInterval(getIntervalFromSliderValue(sliderValue));
  startBalloonTimers();
});

// GO Button event listener
document.addEventListener("DOMContentLoaded", () => {
  const goButton = document.getElementById("game-start-button");
  if (goButton) {
    goButton.addEventListener("click", () => {
      gameStarted = true;
      allowDualBalloons = true;
      startGameFromButton();
    });
  }
});