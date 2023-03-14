const imageContainer = document.querySelector('.image-container');
const closeButton = document.querySelector('.close-icon');
let isFullscreen = false;

imageContainer.addEventListener('click', () => {
  if (!isFullscreen) {
    // enter fullscreen mode
    imageContainer.classList.add('fullscreen');
    isFullscreen = true;

    // create and append close button
    closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#fff" d="M19.85 19.85c-.585.585-1.535.585-2.12 0L12 14.12l-5.73 5.73c-.585.585-1.535.585-2.12 0-.585-.585-.585-1.535 0-2.12L9.88 12 4.15 6.27c-.585-.585-.585-1.535 0-2.12.585-.585 1.535-.585 2.12 0L12 9.88l5.73-5.73c.585-.585 1.535-.585 2.12 0 .585.585.585 1.535 0 2.12L14.12 12l5.73 5.73c.585.585.585 1.535 0 2.12z"/></svg>';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', () => {
      // exit fullscreen mode
      console.log('clicky')
      imageContainer.classList.remove('fullscreen');
      isFullscreen = false;
      closeButton.remove();
    });
    imageContainer.appendChild(closeButton);
  }
});