import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module"; // FOR FPS MONITORING
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { SignPhysics } from "./physics/SignPhysics.js";
import "./style.css";

THREE.Cache.enabled = true;

// Global constants and settings
const FPS_LIMIT = 60;
const TIME_STEP = 1 / FPS_LIMIT;

// Scene objects
let signObject = null;
let signPhysics = null;

// Time tracking
let lastFrameTime = 0;
let accumulatedTime = 0;

// Setup scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Light blue sky

// Setup camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 200, 1000);
camera.lookAt(0, 500, 0);

// Setup renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// FPS monitor
const stats = new Stats();
document.body.appendChild(stats.dom);

// Create a simple UI with only debug buttons
function createControls() {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "10px";
  container.style.right = "10px";
  container.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  container.style.padding = "10px";
  container.style.borderRadius = "5px";
  container.style.color = "white";
  container.style.fontFamily = "Arial, sans-serif";
  container.style.zIndex = "1000";

  const title = document.createElement("div");
  title.textContent = "Sign Controls";
  title.style.marginBottom = "10px";
  title.style.fontWeight = "bold";
  container.appendChild(title);

  // Debug toggle button
  const debugButton = document.createElement("button");
  debugButton.textContent = "Toggle Physics Debug";
  debugButton.style.padding = "5px";
  debugButton.style.width = "100%";
  debugButton.style.marginBottom = "10px";
  debugButton.style.cursor = "pointer";

  // Bounding box toggle button
  const boundingBoxButton = document.createElement("button");
  boundingBoxButton.textContent = "Toggle Bounding Box";
  boundingBoxButton.style.padding = "5px";
  boundingBoxButton.style.width = "100%";
  boundingBoxButton.style.cursor = "pointer";

  container.appendChild(debugButton);
  container.appendChild(boundingBoxButton);
  document.body.appendChild(container);

  // Event handlers
  debugButton.addEventListener("click", () => {
    if (signPhysics) {
      signPhysics.toggleDebug();
    }
  });

  boundingBoxButton.addEventListener("click", () => {
    if (signPhysics) {
      signPhysics.toggleBoundingBox();
    }
  });
}

// Setup lighting
function setupLights() {
  // Key light
  const keyLight = new THREE.DirectionalLight(
    new THREE.Color("hsl(30, 100%, 85%)"),
    2.5
  );
  keyLight.position.set(-100, 100, 100);
  scene.add(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(
    new THREE.Color("hsl(240, 100%, 85%)"),
    1.5
  );
  fillLight.position.set(100, 100, 100);
  scene.add(fillLight);

  // Back light
  const backLight = new THREE.DirectionalLight(0xffffff, 2.0);
  backLight.position.set(100, 100, -100);
  scene.add(backLight);
}

// Load all models
function loadGLTFModels(models) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  models.forEach((model) => {
    loader.load(
      model.path,
      (gltf) => {
        const object = gltf.scene;
        object.position.copy(model.position);
        object.rotation.copy(model.rotation);
        object.scale.copy(model.scale);

        // Apply special materials if needed
        if (model.name === "teapot") {
          object.traverse((node) => {
            if (node.isMesh) {
              applyTeapotMaterial(node);
            }
          });
        } else if (model.name === "capybara") {
          let meshIndex = 0;
          object.traverse((node) => {
            if (node.isMesh) {
              applyCapybaraMaterial(node, meshIndex++);
            }
          });
        }
        // Handle sign specially for physics
        else if (model.name === "sign") {
          signObject = object;

          // Create and initialize sign physics
          signPhysics = new SignPhysics(scene);

          // Use a slight delay to ensure the model is properly positioned
          setTimeout(() => {
            signPhysics.init(signObject);
            createControls();
          }, 100);
        }

        scene.add(object);
        console.log(`${model.name} loaded successfully`);
      },
      undefined,
      (err) => {
        console.error(`Error loading ${model.name}:`, err);
      }
    );
  });
}

// Main animation loop
function animate(currentTime) {
  // Schedule next frame
  requestAnimationFrame(animate);

  // Calculate delta time (clamped to avoid large jumps)
  const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
  lastFrameTime = currentTime;

  // Accumulate time for fixed-step physics
  accumulatedTime += deltaTime;

  // Update physics with fixed time step
  while (accumulatedTime >= TIME_STEP) {
    if (signPhysics && signPhysics.initialized) {
      signPhysics.update(TIME_STEP);
    }
    accumulatedTime -= TIME_STEP;
  }

  // Update controls and render
  controls.update();
  renderer.render(scene, camera);
  stats.update();
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    // 'D' to toggle debug visualization
    if (event.key === "d" || event.key === "D") {
      if (signPhysics) {
        signPhysics.toggleDebug();
      }
    }

    // 'B' to toggle bounding box
    if (event.key === "b" || event.key === "B") {
      if (signPhysics) {
        signPhysics.toggleBoundingBox();
      }
    }
  });
}

// Model definitions
const models = [
  {
    name: "baseAndWindow",
    path: "/assets/base-and-window/base_and_window-transformed.glb",
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    name: "table",
    path: "/assets/long-table/long_table-transformed.glb",
    position: new THREE.Vector3(0, 110, -600),
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
  },
  {
    name: "smallTable",
    path: "/assets/small-table/small_table-transformed.glb",
    position: new THREE.Vector3(-200, 110, -500),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.4, 0.4, 0.4),
  },
  {
    name: "cup",
    path: "/assets/cup/cup-transformed.glb",
    position: new THREE.Vector3(-100, 270, 200),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.3, 0.3, 0.3),
  },
  {
    name: "teapot",
    path: "/assets/teapot/teapot-transformed.glb",
    position: new THREE.Vector3(-500, 110, 0),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "capybara",
    path: "/assets/capybara/capybara-transformed.glb",
    position: new THREE.Vector3(400, 110, 300),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.3, 0.3, 0.3),
  },
  {
    name: "miffy",
    path: "/assets/miffy-glb/miffy-transformed.glb",
    position: new THREE.Vector3(-200, 60, -400),
    rotation: new THREE.Euler(0, Math.PI / 6, 0),
    scale: new THREE.Vector3(1.2, 1.2, 1.2),
  },
  {
    name: "star",
    path: "/assets/star/star-transformed.glb",
    position: new THREE.Vector3(0, 900, -400),
    rotation: new THREE.Euler(0, Math.PI / 4, 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    name: "sign",
    path: "/assets/sign/sign.glb",
    position: new THREE.Vector3(0, 500, 200),
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
];

// Initialize
setupLights();
setupKeyboardShortcuts();
loadGLTFModels(models);

// Start animation loop
lastFrameTime = performance.now();
requestAnimationFrame(animate);

function applyTeapotMaterial(mesh) {
  // load externals
  const textureLoader = new THREE.TextureLoader();
  const normalMap = textureLoader.load("/assets/teapot/model_0_normal.png");

  // set material properties
  mesh.material.transmission = 1.0;
  mesh.material.metalness = 1.0;
  mesh.material.roughness = 0.2;

  // load color
  mesh.material.Color = textureLoader.load("/assets/teapot/model_0_color.png");

  // apply texture via normal map
  mesh.material.normalMap = normalMap;
  mesh.material.needsUpdate = true;
}

function applyCapybaraMaterial(mesh, index) {
  const textureLoader = new THREE.TextureLoader();

  // load textures based on the mesh index
  const colorMap = textureLoader.load(
    `/assets/capybara/model_${index}_color.png`
  );
  const normalMap = textureLoader.load(
    `/assets/capybara/model_${index}_normal.png`
  );
  const roughnessMap = textureLoader.load(
    `/assets/capybara/model_${index}_roughness.png`
  );
  const transmittanceMap = textureLoader.load(
    `/assets/capybara/model_${index}_transmittance.png`
  );

  // for some reason, the glb refers to it as metallicRoughness despite the womp exporting it as metallic
  const metallicMap = textureLoader.load(
    `/assets/capybara/model_${index}_metallicRoughness.png`
  );

  // Ensure the material is MeshPhysicalMaterial (supports transmittance)
  if (!(mesh.material instanceof THREE.MeshPhysicalMaterial)) {
    mesh.material = new THREE.MeshPhysicalMaterial();
  }

  // apply the maps
  mesh.material.map = colorMap;
  mesh.material.metalnessMap = metallicMap;
  mesh.material.normalMap = normalMap;
  mesh.material.roughnessMap = roughnessMap;
  mesh.material.transmissionMap = transmittanceMap;

  // set material properties
  mesh.material.metalness = 1.0;
  mesh.material.roughness = 1.0;
  mesh.material.transmission = 0.5;

  // make the snot shiny
  if (index === 3) {
    // Set material properties for translucency and glossiness
    mesh.material.transmission = 1.0;
    mesh.material.clearcoat = 1.0;
    mesh.material.clearcoatRoughness = 0.01;
    mesh.material.ior = 2.5;
  }

  // Ensure the material updates
  mesh.material.needsUpdate = true;
}
