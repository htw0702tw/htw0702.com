function initCarousel(root) {
  const track = root.querySelector(".track");
  const slides = [...root.querySelectorAll(".slide")];
  const dotsWrap = root.querySelector(".dots");
  if (!track || slides.length === 0) return;
  let i = 0;
  slides.forEach((_, idx) => {
    const b = document.createElement("button");
    b.addEventListener("click", () => go(idx));
    dotsWrap.appendChild(b);
  });
  function go(n) {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i * 100}%)`;
    [...dotsWrap.children].forEach((d, idx) => d.classList.toggle("on", idx === i));
  }
  go(0);
  setInterval(() => go(i + 1), 4200);
}
document.querySelectorAll(".carousel").forEach(initCarousel);
