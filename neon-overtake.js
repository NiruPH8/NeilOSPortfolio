/* Neon Overtake — screenshot gallery and keyboard navigation. */
(() => {
  "use strict";

  const shots = Array.from(document.querySelectorAll("#gameGallery .neon-gallery-item"));
  const dialog = document.getElementById("screenshotDialog");
  const fullImage = document.getElementById("fullScreenshot");
  const title = document.getElementById("screenshotTitle");
  const count = document.getElementById("screenshotNumber");
  let currentIndex = 0;

  function showScreenshot(index) {
    currentIndex = (index + shots.length) % shots.length;
    const selected = shots[currentIndex];
    fullImage.src = selected.dataset.img;
    fullImage.alt = selected.querySelector("img").alt;
    title.textContent = selected.dataset.caption;
    count.textContent = `${currentIndex + 1} / ${shots.length}`;
  }

  shots.forEach((button, index) => {
    button.addEventListener("click", () => {
      showScreenshot(index);
      dialog.showModal();
    });
  });

  document.getElementById("closeScreenshot").addEventListener("click", () => dialog.close());
  document.getElementById("previousScreenshot").addEventListener("click", () => showScreenshot(currentIndex - 1));
  document.getElementById("nextScreenshot").addEventListener("click", () => showScreenshot(currentIndex + 1));

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "ArrowLeft") showScreenshot(currentIndex - 1);
    if (event.key === "ArrowRight") showScreenshot(currentIndex + 1);
  });
})();
