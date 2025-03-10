const toggleCameraButton = document.getElementById('toggleCameraButton');

export let cameraToggle = false;

// Restart the game when clicking the Restart button
toggleCameraButton.addEventListener('click', async () => {
  cameraToggle = !cameraToggle;
  console.log('Camera toggle is now:', cameraToggle);
  return
});