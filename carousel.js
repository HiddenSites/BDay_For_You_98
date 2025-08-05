const carouselFolder = "EncryptedPhotos/Carousel/"; // Base folder for encrypted images

const messages = [
  { 
    text: "You're the shit!!!",
    image: "IMG_7170.jpeg"
  },
  { 
    text: "I love getting cuddled up and cozy with you.",
    image: "IMG_3063.jpeg"
  },
  { 
    text: "Even when you're too sleepy.",
    image: "IMG_3137.jpeg"
  },
  { 
    text: "You still always look cute.",
    image: "IMG_3160.jpeg"
  },
  { 
    text: "You're a great cook and we always make things tasty together.",
    image: "IMG_3034.jpeg"
  },
  { 
    text: "I have so much fun with you, even doing absolutely nothing.",
    image: "IMG_3008.jpeg"
  },
  { 
    text: "You're always improving our home and lives.",
    image: "IMG_3223.jpeg"
  },
  { 
    text: "And you always push me to go outside of my comfort zone.",
    image: "IMG_1563.jpeg"
  },
  { 
    text: "We’ll do bigger things, but I treasure even our smallest adventures.",
    image: "IMG_3236.jpeg"
  },
  { 
    text: "I'm so happy you brought lil Rudy into my life. You're the best mom she could have asked for.",
    image: "baby.jpeg"
  },
  { 
    text: "You always make me laugh and I cherish all of my memories with you. I love you so much and can't wait to keep building our lives together.\n\n\n\n\nLove,\nEvan & Rudy"
  }
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

  // Navigation buttons
  const navButtons = document.querySelectorAll('.carousel-nav button');
  if (navButtons.length === 2) {
    navButtons[0].addEventListener('click', prevSlide);
    navButtons[1].addEventListener('click', nextSlide);
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
    setInterval(spawnHearts, 1000);
    heartsIs = true;
    for (let i = 0; i < 50; i++) spawnHearts();
  }

  showSlide(currentSlide);
}

function prevSlide() {
  if (slides.length === 0) return;
  if (currentSlide === 0 && !heartsIs) return;

  currentSlide = (currentSlide - 1 + slides.length) % slides.length;

  if (currentSlide === slides.length - 1) {
    for (let i = 0; i < 50; i++) spawnHearts();
  }

  showSlide(currentSlide);
}