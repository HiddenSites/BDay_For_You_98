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
    text: "I'm so happy you brought lil Rudy into my life. You're the best mom she could have asked for.",
    image: "baby.jpeg"
  },
    {
    text: "You always make me laugh and I cherish all of my mermories with you. I love you so much and can't wait to keep building our lives together.\n\n\n\n\nLove,\nEvan & Rudy"
  }
];

let currentSlide = 0;
let heartsIs = false;
let slides = [];

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove('visible');
  });

  if (slides[index]) {
    slides[index].classList.add('visible');
  }
}

function nextSlide() {
  if (slides.length === 0) return;
  
  currentSlide = (currentSlide + 1) % slides.length;

  if (currentSlide === slides.length - 1){
    if (!heartsIs){
      setInterval(spawnHearts, 1500);
      heartsIs = true;
    }
    for (let i = 0; i < 50; i++) {
    spawnHearts();
      }
  }
  showSlide(currentSlide);
}

function prevSlide() {
  if (slides.length === 0) return;
  if (currentSlide === 0 && !heartsIs) return;
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  if (currentSlide === slides.length - 1){
    for (let i = 0; i < 50; i++) {
    spawnHearts();
      }
  }
  showSlide(currentSlide);
}

function renderCarousel() {
  const carousel = document.getElementById('message-carousel');
  if (!carousel) {
    console.error('No element with ID "message-carousel" found!');
    return;
  }

  messages.forEach((msg) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';

    const p = document.createElement('p');
    p.textContent = msg.text;
    slide.appendChild(p);

    if (msg.image) {
      const img = document.createElement('img');
      img.src = msg.image;
      img.alt = 'Memory photo';
      slide.appendChild(img);
    }

    carousel.appendChild(slide);
  });

  slides = Array.from(document.querySelectorAll('.carousel-slide'));
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

  // Nav buttons
  const navButtons = document.querySelectorAll('.carousel-nav button');
  if (navButtons.length === 2) {
    navButtons[0].addEventListener('click', prevSlide);
    navButtons[1].addEventListener('click', nextSlide);
  }
}

function spawnHearts() {
  const heart = document.createElement("div");
  heart.textContent = "❤️"; // Basic red heart emoji
  heart.style.position = "fixed";
  heart.style.top = "-50px";
  heart.style.fontSize = Math.random() * 20 + 20 + "px"; // 20px to 40px
  heart.style.opacity = 0.85;
  heart.style.zIndex = "5";
  heart.style.pointerEvents = 'none';

  const startLeft = Math.random() * window.innerWidth;
  heart.style.left = `${startLeft}px`;

  document.body.appendChild(heart);

  let y = -50;
  const fallSpeed = Math.random() * 1.5 + 0.5;
  const swayAmount = Math.random() * 2 - 1;

  const fallInterval = setInterval(() => {
    y += fallSpeed;
    const sway = Math.sin(y / 20) * swayAmount * 5;
    heart.style.top = `${y}px`;
    heart.style.left = `${startLeft + sway}px`;

    if (y > window.innerHeight + 50) {
      clearInterval(fallInterval);
      heart.remove();
    }
  }, 16);
}

document.addEventListener('DOMContentLoaded', renderCarousel);
