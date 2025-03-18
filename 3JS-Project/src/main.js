import * as THREE from "three";
import "./styles.css";

// Import core modules
import { loadGLTFModels, signPhysics, createControls, starObject, capysleepinPosition } from "./core/models.js";
import { updateAnimations, setCroissantBaker } from "./core/animations.js";
import { initSplinePaths, updateCameraPath, updateStarPath, initStarLight, cameraControlPoints, toggleSplineVisuals } from "./core/paths.js";
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
  capybaraLight,
} from "./core/renderer.js";
import { createGround } from "./core/ground.js";

// Import physics modules
import { CroissantBaker } from "./physics/CroissantBaker.js";

// Global constants and settings
const FPS_LIMIT = 60;
const TIME_STEP = 1 / FPS_LIMIT;

let pathStartTime = null; // Track when camera starts moving along spline
let firstBlackoutStartTime = null; // Track when blackout starts
let secondBlackoutStartTime = null;
let capybaraRemoved = false;
let firstBlackoutRemoved = false; // Flag to track if blackout has been removed
let secondBlackoutRemoved = false;
let lightsEnabled = false; // Flag to track if lights should stay enabled permanently

export const animationTiming  = {
  BEGIN_ANIMATION_SEQUENCE: Infinity // Time sampled when blackout starts
} 

// Time tracking for physics
let lastPhysicsTime = 0;
let accumulatedTime = 0;

// Initialize croissant baker
let croissantBaker = null;
let ovenObject = null;
let croissantObject = null;

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
      //console.warn("Blackout div not found.");
  }
}

function handlePathMode(elapsedTime) {
  if (animationTiming.BEGIN_ANIMATION_SEQUENCE === Infinity) {
    console.warn("BEGIN_ANIMATION_SEQUENCE has not been set.");
    return;
  }

  // Calculate relative elapsed time based on BEGIN_ANIMATION_SEQUENCE
  const relativeElapsedTime = elapsedTime - animationTiming.BEGIN_ANIMATION_SEQUENCE;

  // Define durations for each phase
  const stationaryDuration = 6; // Time to view sleeping capybara
  const firstBlackoutDuration = 1; // Duration of first blackout
  const starViewDuration = 7; // Time to watch star animation
  const secondBlackoutDuration = 3; // Duration of second blackout

  // Background lerp logic during final transition phase
  const transitionStartTime =
    animationTiming.BEGIN_ANIMATION_SEQUENCE +
    stationaryDuration +
    firstBlackoutDuration +
    starViewDuration +
    secondBlackoutDuration;

  // Scene 1: View sleeping capybara
  if (relativeElapsedTime < stationaryDuration) {
    camera.position.copy(capysleepinPosition.clone().add(new THREE.Vector3(0, 200, 400)));
    camera.lookAt(capysleepinPosition);

    scene.environment = null;
    [keyLight, fillLight, backLight].forEach(light => light.visible = true); // Turn off main lights
    capybaraLight.visible = true;
    // console.log("Capybara light is :", capybaraLight.visible)
    

    return;
  }

  // Scene 1 END: Trigger first blackout
  if (relativeElapsedTime >= stationaryDuration && relativeElapsedTime < stationaryDuration + firstBlackoutDuration) {
    if (!firstBlackoutStartTime) {
      createBlackout();
      firstBlackoutStartTime = elapsedTime; // Record start time of blackout
      
    }
    return;
  }

  // During first blackout: teleport camera and remove capybara
  if (relativeElapsedTime >= stationaryDuration + firstBlackoutDuration && !capybaraRemoved) {
    const startPoint = cameraControlPoints[0];
    camera.position.set(startPoint[0], startPoint[1], startPoint[2]);

    capybaraLight.visible = false;
    [keyLight, fillLight, backLight].forEach(light => light.visible = false); // Turn off main lights

    const capybara = scene.getObjectByName("capy-sleeping");
    if (capybara) scene.remove(capybara);

    capybaraLight.visible = false; // Turn off light after removal
    capybaraRemoved = true;

    const cloud = scene.getObjectByName("cloud");
    if (cloud) {
      const cloudWorldPosition = new THREE.Vector3();
      cloud.getWorldPosition(cloudWorldPosition);
      camera.lookAt(cloudWorldPosition);
    }

    removeBlackout(); // End first blackout
    return;
  }

  // Remove first blackout and begin watching star animation
  if (!firstBlackoutRemoved && elapsedTime >= firstBlackoutStartTime + firstBlackoutDuration) {
    removeBlackout();
    firstBlackoutRemoved = true;
    return;
  }

  // SCENE 2 - Star gazing:
  if (relativeElapsedTime >= stationaryDuration + firstBlackoutDuration && relativeElapsedTime < stationaryDuration + firstBlackoutDuration + starViewDuration) {
    // updateStarPath(relativeElapsedTime - (stationaryDuration + firstBlackoutDuration)); // Animate star movement
    // do nothing, just stare :)
    return;
  }

  // SCENE 2 END: Trigger 2nd blackout
  if (relativeElapsedTime >= stationaryDuration + firstBlackoutDuration + starViewDuration && relativeElapsedTime < stationaryDuration + firstBlackoutDuration + starViewDuration + secondBlackoutDuration) {
    if (!secondBlackoutStartTime) {
      createBlackout();
      secondBlackoutStartTime = elapsedTime; // Record start time of second blackout
      [keyLight, fillLight, backLight].forEach(light => light.visible = true); // Turn on main lights
      scene.environment = envMap;
      // ✅ REMOVE STAR, MOON, CLOUD HERE (clearly once):
      ["star", "moon", "cloud"].forEach(name => {
        const obj = scene.getObjectByName(name);
        if (obj) {
            scene.remove(obj);
        }
      });
    }
    return;
  }

  // SCENE 3+ TRANSITION:
  if (relativeElapsedTime >= stationaryDuration + firstBlackoutDuration + starViewDuration + secondBlackoutDuration) {
    removeBlackout();

    startBackgroundLerp(animationTiming.BEGIN_ANIMATION_SEQUENCE + stationaryDuration + firstBlackoutDuration + starViewDuration + secondBlackoutDuration); // Begin background color transition

    const adjustedElapsedTime =
      relativeElapsedTime - (stationaryDuration + firstBlackoutDuration + starViewDuration + secondBlackoutDuration);
    
    updateCameraPath(camera, adjustedElapsedTime); // Move camera along spline path
  }
}

function startBackgroundLerp(startTime) {
  const lerpDuration = 12; // Duration of background color transition in seconds

  function lerpBackgroundColor(elapsedTime) {
    const progress = Math.min((elapsedTime - startTime) / lerpDuration, 1);
    
    const blackColor = new THREE.Color(0x000000);
    const blueColor = new THREE.Color(0x87ceeb);

    scene.background.copy(blackColor).lerp(blueColor, progress);

    if (progress < 1) {
      requestAnimationFrame(() => lerpBackgroundColor(clock.getElapsedTime()));
    }
  }

  requestAnimationFrame(() => lerpBackgroundColor(clock.getElapsedTime()));
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
  const controls = createControls(
    initCameraToggle, // Pass camera toggle initializer
    CAMERA_MODE,      // Pass camera mode constants
    cameraMode       // Pass current camera mode
  );
  
  // Setup keyboard shortcuts for camera movement
  setupCameraKeyboardControls(camera, controls, signPhysics);
  
  // Load all models
  loadGLTFModels();
  
  // Add event handler for spline visualization toggle
  if (controls.splineButton) {
    controls.splineButton.addEventListener("click", () => {
      const isVisible = toggleSplineVisuals();
      controls.splineButton.textContent = isVisible ? 
        "Hide Spline Visualizations" : 
        "Show Spline Visualizations";
    });
  }
  
  // Store reference to controls for updating later
  window.controlsReference = controls;
  
  // Track loading progress
  let loadingStartTime = performance.now();
  
  // Setup polling to check when models are loaded
  const checkForModels = () => {
    // Find oven and croissant models for the baker
    ovenObject = scene.getObjectByName("oven");
    croissantObject = scene.getObjectByName("croissant");
    
    if (ovenObject && croissantObject) {
      console.log("Found oven and croissant objects:", 
                  {oven: ovenObject.name, croissant: croissantObject.name});
      
      // Initialize the croissant baker
      croissantBaker = new CroissantBaker(scene);
      croissantBaker.init(ovenObject, croissantObject, {
        heatingDuration: 15,  // 15 seconds heating in the oven
        coolingDuration: 10   // 10 seconds cooling after removal
      });
      console.log("CroissantBaker initialized with oven and croissant objects");
      
      // Pass the croissant baker to animations.js
      setCroissantBaker(croissantBaker);
      
      // Enable the camera button now that everything is loaded
      enableCameraButton();
      
      console.log(`Scene fully loaded in ${((performance.now() - loadingStartTime) / 1000).toFixed(2)} seconds`);
    } else {
      console.log("Waiting for models to load...");
      // Try again in 200ms
      setTimeout(checkForModels, 200);
    }
  };
  
  // Start polling after a brief delay to give models time to start loading
  setTimeout(checkForModels, 500);

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
 * Enable the camera button once everything is loaded
 */
function enableCameraButton() {
  if (window.controlsReference) {
    if (window.controlsReference.cameraButton) {
      const cameraButton = window.controlsReference.cameraButton;
      cameraButton.disabled = false;
      cameraButton.style.opacity = "1";
      cameraButton.style.cursor = "pointer";
      cameraButton.title = "Click to change camera mode";
      console.log("Camera button enabled");
    }
    
    // Also enable the spline button
    if (window.controlsReference.splineButton) {
      const splineButton = window.controlsReference.splineButton;
      splineButton.disabled = false;
      splineButton.style.opacity = "1";
      splineButton.style.cursor = "pointer";
      splineButton.title = "Click to toggle spline visualizations";
      console.log("Spline button enabled");
    }
    
    // Also enable the physics button
    if (window.controlsReference.physicsButton) {
      const physicsButton = window.controlsReference.physicsButton;
      physicsButton.disabled = false;
      physicsButton.style.opacity = "1";
      physicsButton.style.cursor = "pointer";
      physicsButton.title = "Click to toggle physics visualization";
      console.log("Physics button enabled");
    }
  }
}

/**
 * Main animation loop
 */
function animate() {
  // Calculate timing
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  const currentTime = performance.now();

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
    
    // Update croissant baker if initialized
    if (croissantBaker && croissantBaker.initialized) {
      croissantBaker.update(TIME_STEP);
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
      // Begin Scene transitioning
      handlePathMode(elapsedTime);
      break;
  }

  // // Update star position along its path
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
