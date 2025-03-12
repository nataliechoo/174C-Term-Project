import * as THREE from "three";
import "./styles.css";

// Import core modules
import { loadGLTFModels, signPhysics, createControls, starObject } from "./core/models.js";
import { updateAnimations } from "./core/animations.js";
import { initSplinePaths, updateCameraPath, updateStarPath, initStarLight } from "./core/paths.js";
import { 
  initCamera, 
  initControls, 
  setupCameraKeyboardControls, 
  cameraMode,
  CAMERA_MODE,
  initCameraToggle,
  //updateStarFollowCamera 
} from "./core/camera.js";
import { 
  initRenderer, 
  setupEnvironment, 
  initLighting, 
  initStats,
  keyLight,
  fillLight,
  backLight,
} from "./core/renderer.js";

// Global constants and settings
const FPS_LIMIT = 60;
const TIME_STEP = 1 / FPS_LIMIT;

// Time tracking for physics
let lastPhysicsTime = 0;
let accumulatedTime = 0;

// Initialize core components
THREE.Cache.enabled = true;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Light blue sky (0x87ceeb)

// Setup clock
const clock = new THREE.Clock();

// Initialize camera, renderer, and controls
const camera = initCamera(window.innerWidth, window.innerHeight);
const renderer = initRenderer(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = initControls(camera, renderer.domElement);

let envMap; // for HDR environment map

// Initialize lighting and environment
initLighting(scene);
setupEnvironment(scene, renderer);

// FPS monitoring
const stats = initStats();

// Handle window resizing
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
});

/**
 * Initialize the scene
 */
function init() {
  // Create combined controls UI for camera and physics
  createControls(
    initCameraToggle, // Pass camera toggle initializer
    CAMERA_MODE,      // Pass camera mode constants
    cameraMode        // Pass current camera mode
  );
  
  // Setup keyboard shortcuts for camera movement
  setupCameraKeyboardControls(camera, controls, signPhysics);
  
  // Load all models
  loadGLTFModels();
  initStarLight();

  envMap = setupEnvironment(scene, renderer);
  // Initialize B-spline paths
  initSplinePaths();
  
  // Start animation loop
  lastPhysicsTime = performance.now();
  setTimeout(() => {
    animate();
  }, 1000 / FPS_LIMIT);
}



/**
 * Main animation loop
 */
function animate() {
  // Calculate timing
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  const currentTime = performance.now();
  
  const blackColor = new THREE.Color(0x000000);
  const blueColor = new THREE.Color(0x87ceeb);
  
  const transitionStartTime = 11.5; // seconds
  const delayBeforeVisibleTransition = 3.5; // first 3 seconds remain visually black
  const actualLerpDuration = 9; // then actually lerp over next 2 seconds

  // Calculate physics delta time (clamped to avoid large jumps)
  const physicsDeltaTime = Math.min((currentTime - lastPhysicsTime) / 1000, 0.1);
  lastPhysicsTime = currentTime;

  // Accumulate time for fixed-step physics
  accumulatedTime += physicsDeltaTime;

  // Update physics with fixed time step
  while (accumulatedTime >= TIME_STEP) {
    if (signPhysics && signPhysics.initialized) {
      signPhysics.update(TIME_STEP);
    }
    accumulatedTime -= TIME_STEP;
  }

  // Handle camera modes
  switch (cameraMode) {
    case CAMERA_MODE.MANUAL:
      // Manual camera control using OrbitControls
      controls.update();
      break;
    
    case CAMERA_MODE.PATH:
      // Camera follows the B-spline path
      updateCameraPath(camera, elapsedTime);
      break;
    
    // case CAMERA_MODE.FOLLOW_STAR:
    //   // Camera follows the star object
    //   updateStarFollowCamera(camera, starObject);
    //   break;
  }

  if (elapsedTime < transitionStartTime + delayBeforeVisibleTransition) {
    scene.background.copy(blackColor);
    scene.environment = null;
    [keyLight, fillLight, backLight].forEach(light => light.visible = false);
  } else if (elapsedTime >= (transitionStartTime + delayBeforeVisibleTransition) && elapsedTime <= (transitionStartTime + delayBeforeVisibleTransition + actualLerpDuration)) {
      const lerpFactor =
        (elapsedTime - (transitionStartTime + delayBeforeVisibleTransition)) /
        actualLerpDuration;

      scene.background.copy(blackColor).lerp(blueColor, lerpFactor);
      
      [keyLight, fillLight, backLight].forEach(light => light.visible = true);
  } else if(elapsedTime > (transitionStartTime + delayBeforeVisibleTransition + actualLerpDuration)){
      scene.background.copy(blueColor);
      [keyLight, fillLight, backLight].forEach(light => light.visible = true);
      renderer.toneMappingExposure = 0.5; // final exposure
      scene.environment = envMap;
  }

  // Update star position along its path
  updateStarPath(elapsedTime);
  
  // Update all animation mixers
  updateAnimations(delta);

  // Render the scene
  renderer.render(scene, camera);
  stats.update();
  
  // Schedule next frame
  requestAnimationFrame(animate);
}

// Initialize the application
init();
