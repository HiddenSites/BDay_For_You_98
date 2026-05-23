const carouselFolder = "EncryptedPhotos/Carousel/"; // Base folder for encrypted images

const messages = [
  { 
    text: "Pet Rudy 50 times to see your presents",
  },
  { 
    text: "I can't wait to build a life with you. From lazy Sunday mornings to chasing dreams together, you're everything I want. Every moment with you feels like home. I love you so much, and I'm so grateful for you. Thank you for being my person. I'm paying for your shopping spree on Saturday—spoil yourself because you deserve it. Love, Evan ❤️",
  },
];

let currentSlide = 0;
let heartsIs = false;
let slides = [];
let decryptedMessages = []; // Will hold decrypted messages

// In preloadCarouselImages, use decryptRelativeImage to keep code clean
async function preloadCarouselImages() {
  decryptedMessages.length = 0;

  for (const item of messages) {
    const newItem = { text: item.text };

    if (item.image) {
      try {
        // item.image is just the relative image path like 'Balloons/IMG_2559.jpeg'
        const blob = await decryptRelativeImage(carouselFolder, item.image, riddleKey);
        newItem.image = URL.createObjectURL(blob);
      } catch (e) {
        console.error("Failed to decrypt carousel image:", item.image, e);
        newItem.image = null;
      }
    }

    decryptedMessages.push(newItem);
  }
}

async function renderCarousel() {
  const carousel = document.getElementById("message-carousel");
  if (!carousel) {
    console.error('No element with ID "message-carousel" found!');
    return;
  }

  carousel.innerHTML = ""; // Clear previous
  slides = [];

  for (const msg of decryptedMessages) {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";

    const p = document.createElement("p");
    p.textContent = msg.text;
    slide.appendChild(p);

    if (msg.image) {
      const img = document.createElement("img");
      img.src = msg.image; // ✅ Use pre-decrypted blob URL
      img.alt = "Memory photo";
      slide.appendChild(img);
    }

    carousel.appendChild(slide);
    slides.push(slide);
  }

  if (slides.length > 0) {
    showSlide(currentSlide);
  }

  // Swipe gestures
  let touchStartX = 0;
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  });

  carousel.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 50) prevSlide();
    else if (diff < -50) nextSlide();
  });

  // Navigation buttons - DISABLED for balloon popping experience
  const navButtons = document.querySelectorAll('.carousel-nav button');
  if (navButtons.length === 2) {
    navButtons[0].style.display = 'none';
    navButtons[1].style.display = 'none';
    // Buttons are disabled - navigate only via carousel completion
  }
}

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove('visible'));
  if (slides[index]) {
    slides[index].classList.add('visible');
  }
}

function nextSlide() {
  if (slides.length === 0) return;
  currentSlide = (currentSlide + 1) % slides.length;

  if (currentSlide === slides.length - 1 && !heartsIs) {

  }

  showSlide(currentSlide);
}

function prevSlide() {
  if (slides.length === 0) return;
  if (currentSlide === 0 && !heartsIs) return;

  currentSlide = (currentSlide - 1 + slides.length) % slides.length;

  showSlide(currentSlide);
}