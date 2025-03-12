import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Camera mode constants
export const CAMERA_MODE = {
  MANUAL: 0,
  PATH: 1,
  FOLLOW_STAR: 2
};

// Camera mode state (replaced boolean toggle)
export let cameraMode = CAMERA_MODE.MANUAL;

// For backward compatibility
export let cameraToggle = false;

/**
 * Initialize camera
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @returns {THREE.PerspectiveCamera} Initialized camera
 */
export function initCamera(width, height) {
  // Setup camera
  const camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.1,
    10000
  );
  camera.position.set(0, 200, 1000);
  camera.lookAt(0, 500, 0);
  
  return camera;
}

/**
 * Initialize camera controls
 * @param {THREE.PerspectiveCamera} camera - The camera to control
 * @param {HTMLElement} domElement - DOM element for controls
 * @returns {OrbitControls} Initialized controls
 */
export function initControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  
  return controls;
}

/**
 * Setup keyboard controls for camera movement
 * @param {THREE.PerspectiveCamera} camera - The camera to move
 * @param {OrbitControls} controls - Camera controls
 * @param {object} physics - Physics object with toggleable debug features
 */
export function setupCameraKeyboardControls(camera, controls, physics) {
  window.addEventListener("keydown", (event) => {
    const moveSpeed = 40; 

    // Get camera current forward direction
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // Compute left vector as cross product of camera.up and forward
    const left = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

    // Move left (add left vector)
    if (event.key.toLowerCase() === "a") {
      camera.position.addScaledVector(left, moveSpeed);
      controls.target.addScaledVector(left, moveSpeed);
    }
    // Move right (subtract left vector)
    else if (event.key.toLowerCase() === "d") {
      camera.position.addScaledVector(left, -moveSpeed);
      controls.target.addScaledVector(left, -moveSpeed);
    }
    
    // 'D' to toggle debug visualization (physics)
    if (event.key === "d" || event.key === "D") {
      if (physics) {
        physics.toggleDebug();
      }
    }

    // 'B' to toggle bounding box (physics)
    if (event.key === "b" || event.key === "B") {
      if (physics) {
        physics.toggleBoundingBox();
      }
    }
  });
}

/**
 * Initialize camera toggle button and functionality
 * @param {HTMLButtonElement} toggleButton - Button element for camera toggle
 */
export function initCameraToggle(toggleButton) {
  if (toggleButton) {
    // Set initial state when function is first called
    cameraMode = CAMERA_MODE.MANUAL;
    cameraToggle = false;
    
    toggleButton.addEventListener('click', () => {
      // Cycle through camera modes: Manual -> Path -> Follow Star -> Manual
      cameraMode = (cameraMode + 1) % 3;
      
      // Update button text based on current mode
      switch (cameraMode) {
        case CAMERA_MODE.MANUAL:
          toggleButton.textContent = 'Camera Mode: Manual';
          break;
        case CAMERA_MODE.PATH:
          toggleButton.textContent = 'Camera Mode: Path';
          break;
        case CAMERA_MODE.FOLLOW_STAR:
          toggleButton.textContent = 'Camera Mode: Follow Star';
          break;
      }
      
      // For backward compatibility
      cameraToggle = cameraMode !== CAMERA_MODE.MANUAL;
      
      console.log('Camera mode is now:', cameraMode);
    });
  } else {
    console.warn('Toggle camera button not provided');
  }
}

/**
 * Makes the camera follow the star with offset
 * @param {THREE.PerspectiveCamera} camera - The camera to position
 * @param {THREE.Object3D} starObject - The star object to follow
 */
export function updateStarFollowCamera(camera, starObject) {
  if (!starObject) return;
  
  // Position camera behind and slightly above the star
  const offset = new THREE.Vector3(0, 100, 400);
  
  // Set camera position relative to star
  camera.position.copy(starObject.position).add(offset);
  
  // Look at the star
  camera.lookAt(starObject.position);
} 