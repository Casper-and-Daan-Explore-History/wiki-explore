const imageContainer = document.querySelector(".image-container");
const closeButton = document.querySelector(".close-icon");
let isFullscreen = false;

imageContainer.addEventListener("click", () => {
  if (!isFullscreen) {
    // enter fullscreen mode
    imageContainer.classList.add("fullscreen");
    imageContainer.classList.remove("grow");
    isFullscreen = true;
  } else {
    // exit fullscreen mode
    imageContainer.classList.remove("fullscreen");
    imageContainer.classList.add("grow");
    isFullscreen = false;
  }
});
