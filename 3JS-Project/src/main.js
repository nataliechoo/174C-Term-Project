import * as THREE from "three";
import "./styles.css";

// Import core modules
import { loadGLTFModels, signPhysics, createControls, starObject } from "./core/models.js";
import { updateAnimations } from "./core/animations.js";
import { initSplinePaths, updateCameraPath, updateStarPath, initStarLight, cameraControlPoints } from "./core/paths.js";
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
import { createGround } from "./core/ground.js";

// Global constants and settings
const FPS_LIMIT = 60;
const TIME_STEP = 1 / FPS_LIMIT;

let pathStartTime = null; // Track when camera starts moving along spline
let blackoutStartTime = null; // Track when blackout starts
let blackoutRemoved = false; // Flag to track if blackout has been removed
let lightsEnabled = false; // Flag to track if lights should stay enabled permanently
export const animationTiming  = {
  BEGIN_ANIMATION_SEQUENCE: Infinity // Time sampled when blackout starts
} 

// Time tracking for physics
let lastPhysicsTime = 0;
let accumulatedTime = 0;

// Initialize core components
THREE.Cache.enabled = true;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Light blue sky (0x87ceeb)

// Setup clock
export const clock = new THREE.Clock();

// Initialize camera, renderer, and controls
const camera = initCamera(window.innerWidth, window.innerHeight);
const renderer = initRenderer(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = initControls(camera, renderer.domElement);

let envMap; // for HDR environment map

function createBlackout() {
  console.log("Creating blackout...");
  const blackoutDiv = document.createElement('div');
  blackoutDiv.id = 'blackoutDiv';
  blackoutDiv.style.position = 'fixed';
  blackoutDiv.style.top = '0';
  blackoutDiv.style.left = '0';
  blackoutDiv.style.width = '100%';
  blackoutDiv.style.height = '100%';
  blackoutDiv.style.backgroundColor = 'black';
  blackoutDiv.style.zIndex = '1000'; // Ensure it's on top of your canvas

  document.body.appendChild(blackoutDiv);

  // Store reference to remove later
  window.blackoutDiv = blackoutDiv;
}

function removeBlackout() {
  const blackoutDiv = document.getElementById('blackoutDiv'); // Find the div by ID
  if (blackoutDiv) {
      document.body.removeChild(blackoutDiv); // Safely remove it from the DOM
      console.log("Blackout removed.");
  } else {
      console.warn("Blackout div not found.");
  }
}

function handlePathMode(elapsedTime) {
    const stationaryDuration = 6; // Time to remain stationary before blackout
    const blackoutDuration = 3;   // Duration of blackout effect

    if (!pathStartTime) {
        // Initial setup: Camera looks at cloud and moves to first control point
        const cloud = scene.getObjectByName("cloud");
        if (cloud) {
            const cloudWorldPosition = new THREE.Vector3();
            cloud.getWorldPosition(cloudWorldPosition);
            camera.lookAt(cloudWorldPosition);
        }

        const startPoint = cameraControlPoints[0];
        camera.position.set(startPoint[0], startPoint[1], startPoint[2]);

        pathStartTime = elapsedTime; // Record when PATH starts
        return;
    }

    if (elapsedTime < pathStartTime + stationaryDuration) {
        // During stationary phase, do nothing (camera stays still)
        return;
    }

    if (!blackoutStartTime) {
        // Start blackout effect after stationary phase
        createBlackout();
        blackoutStartTime = elapsedTime; // Record start time of blackout
        return;
    }

    if ((elapsedTime >= blackoutStartTime + blackoutDuration) && !blackoutRemoved) {
        // End blackout and start moving along spline
        removeBlackout();
        [keyLight, fillLight, backLight].forEach(light => light.visible = true); // Enable lights permanently
        lightsEnabled = true;
        blackoutRemoved = true;
        console.log("Blackout removed at:", elapsedTime);
    }

    if (blackoutRemoved) {
      // After blackout ends, move the camera along the spline
      const adjustedElapsedTime = elapsedTime - (pathStartTime + stationaryDuration + blackoutDuration);
      updateCameraPath(camera, adjustedElapsedTime); // Start moving camera along spline
  }
}



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
    cameraMode,       // Pass current camera mode
    clock             // 3js clock counter
  );
  
  // Setup keyboard shortcuts for camera movement
  setupCameraKeyboardControls(camera, controls, signPhysics);
  
  // Load all models
  loadGLTFModels();

  initStarLight();
  createGround();


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
      handlePathMode(elapsedTime);
      if (!lightsEnabled) {
        [keyLight, fillLight, backLight].forEach(light => light.visible = false); // Disable lights temporarily
        scene.environment = null;
      } else {
          [keyLight, fillLight, backLight].forEach(light => light.visible = true); // Ensure lights stay enabled permanently
          scene.environment = envMap;
      }

      // Start lerping only after BEGIN_ANIMATION_SEQUENCE is set
      if (animationTiming.BEGIN_ANIMATION_SEQUENCE !== Infinity) {
        const transitionStartTime = animationTiming.BEGIN_ANIMATION_SEQUENCE + 6; // as animation sequence begins
        const actualLerpDuration = 12; // Lerp duration (12 seconds)
        
      if (elapsedTime >= transitionStartTime && elapsedTime <= transitionStartTime + actualLerpDuration) {
          const lerpFactor = (elapsedTime - transitionStartTime) / actualLerpDuration;
          scene.background.copy(blackColor).lerp(blueColor, lerpFactor);
          [keyLight, fillLight, backLight].forEach(light => light.visible = true);
          renderer.toneMappingExposure = 0.5; // final exposure
          scene.environment = envMap;
      } else if (elapsedTime > transitionStartTime + actualLerpDuration) {
          scene.background.copy(blueColor); // Final background color
      }
    }
      break;
  }

  // Update star position along its path
  updateStarPath(elapsedTime);
  
  // Update all animation mixers
  updateAnimations(delta, elapsedTime);

  // Render the scene
  renderer.render(scene, camera);
  stats.update();
  
  // Schedule next frame
  requestAnimationFrame(animate);
}

// Initialize the application
init();
