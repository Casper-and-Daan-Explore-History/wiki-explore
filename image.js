const imageContainer = document.querySelector('.image-container');
const closeButton = document.querySelector('.close-icon');
let isFullscreen = false;

imageContainer.addEventListener('click', () => {
if (!isFullscreen) {
// enter fullscreen mode
imageContainer.classList.add('fullscreen');
isFullscreen = true;
} else {
// exit fullscreen mode
imageContainer.classList.remove('fullscreen');
isFullscreen = false;
}
});

closeButton.addEventListener('click', () => {
// exit fullscreen mode
console.log("HEYYAAAAAAA");
imageContainer.classList.remove('fullscreen');
isFullscreen = false;
});