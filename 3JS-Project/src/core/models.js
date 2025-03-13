import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { scene } from "../main.js";
import { applyTeapotMaterial, applyMoonMesh, applyCapybaraMaterial } from "./materials.js";
import {
  miffyBarista,
  cloudAnimation,
  ovenOpen,
  doorOpen,
} from "./animations.js";
import { SignPhysics } from "../physics/SignPhysics.js";
import { mixers } from "./animations.js";

// Global object references
export let starObject = null;
export let signObject = null;
export let signPhysics = null;

//tray position (for items placed on it)
export const trayPosition = new THREE.Vector3(-60, 260, 40);

// Model definitions
export const models = [
  {
    name: "base",
    path: "/assets/new-base/foundation-base2-transformed.glb",
    position: new THREE.Vector3(-300, 0, 0),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "oven",
    path: "/assets/oven/oven-transformed.glb",
    position: new THREE.Vector3(-500, 265, -500),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    name: "table",
    path: "/assets/long-table/long-table-transformed.glb",
    position: new THREE.Vector3(350, 110, -500),
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
  },
  {
    name: "smallTable",
    path: "/assets/small-table/small-table-transformed-transformed.glb",
    position: new THREE.Vector3(700, 110, -880),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
  },
  {
    name: "smallTable2",
    path: "/assets/small-table/small-table-transformed-transformed.glb",
    position: new THREE.Vector3(420, 110, 90), // New table in front-right area
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.4, 0.4, 0.4),
  },
  {
    name: "stool-long-table-1",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(120, 150, 50),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  },
  {
    name: "stool-long-table-2",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(120, 150, 200),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  },
  {
    name: "stool-long-table-3",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(120, 150, 350),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  },
  {
    name: "stool-small-table-back-1",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(120, 150, -350),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  }, {
    name: "stool-small-table-back-2",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(250, 150, -500),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  }, {
    name: "stool-small-table-front-1",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(250, 150, 550),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  }, {
    name: "stool-small-table-front-2",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(-100, 150, 550),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  },
  //cup, croissant, donut are relatively positioned to tray (global var)
  {
    name: "donut",
    path: "/assets/donut/donut-transformed.glb",
    position: trayPosition.clone().add(new THREE.Vector3(0, 5, 70)),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(1.5, 1.5, 1.5),
  },
  {
    name: "croissant",
    path: "/assets/croissant/croissant-transformed.glb",
    position: trayPosition.clone().add(new THREE.Vector3(0, 20, -10)),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(1.5, 1.5, 1.5),
  },
  {
    name: "plant",
    path: "/assets/plant/plant-transformed.glb",
    position: new THREE.Vector3(280, 260, -300),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(.75, .75, .75),
  },
  {
    name: "tray",
    path: "/assets/tray/tray-transformed.glb",
    position: trayPosition,
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(1.5, 1.5, 1.5),
  },
  {
    name: "cup",
    path: "/assets/cup/cup-transformed.glb",
    position: new THREE.Vector3(260, 265, 180),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.3, 0.3, 0.3),
  },
  {
    name: "teapot",
    path: "/assets/teapot/teapot-transformed.glb",
    position: new THREE.Vector3(260, 135, 300),
    rotation: new THREE.Euler(0, Math.PI * 7 / 16, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "capybara",
    path: "/assets/capybara/capy-edited-in-blender-transformed.glb",
    position: new THREE.Vector3(-500, 150, 600),
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    scale: new THREE.Vector3(0.4, 0.4, 0.4),
  },
  {
    name: "barista-miffy",
    path: "/assets/miffy-animation/miffy_pickup_and_putdown-transformed.glb",
    position: new THREE.Vector3(-500, 110, -350),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "cashier-miffy",
    path: "/assets/miffy-animation/miffy-wave-fixed-arms-transformed.glb",
    position: new THREE.Vector3(-280, 110, -300),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "star",
    path: "/assets/star/star-transformed.glb",
    position: new THREE.Vector3(750, 300, -3150), // start of spline, y-100
    rotation: new THREE.Euler(-Math.PI / 8, Math.PI / 4, -Math.PI / 8),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    name: "sign",
    path: "/assets/sign/textured-sign-transformed.glb",
    position: new THREE.Vector3(-400, 550, -880),
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    scale: new THREE.Vector3(5, 5, 5),
  },
  {
    name: "cloud",
    path: "/assets/cloud-animation/cloud2-transformed.glb",
    position: new THREE.Vector3(0, 300, -5000),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(5, 5, 5),
  },
  {
    name: "moon",
    path: "/assets/moon/moon-transformed.glb",
    position: new THREE.Vector3(0, 300, -5000),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(5, 5, 5),
  },
];

/**
 * Creates UI controls for the sign physics and camera modes
 * @param {Function} initCameraMode - Function to initialize camera mode
 * @param {Object} cameraModes - Camera mode constants
 * @param {Number} currentMode - Current camera mode
 * @returns {Object} UI container and controls
 */
export function createControls(initCameraMode, cameraModes, currentMode) {
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
  title.textContent = "Controls";
  title.style.marginBottom = "10px";
  title.style.fontWeight = "bold";
  container.appendChild(title);

  // Camera mode toggle button
  const cameraButton = document.createElement("button");
  cameraButton.id = "toggleCameraButton";
  cameraButton.textContent = "Camera Mode: Manual";
  cameraButton.style.padding = "5px";
  cameraButton.style.width = "100%";
  cameraButton.style.marginBottom = "10px";
  cameraButton.style.cursor = "pointer";

  // Set initial camera button text based on current mode
  if (cameraModes && currentMode !== undefined) {
    switch (currentMode) {
      case cameraModes.MANUAL:
        cameraButton.textContent = 'Camera Mode: Manual';
        break;
      case cameraModes.PATH:
        cameraButton.textContent = 'Camera Mode: Path';
        break;
      case cameraModes.FOLLOW_STAR:
        cameraButton.textContent = 'Camera Mode: Follow Star';
        break;
    }
  }

  // Combined physics toggle button
  const physicsButton = document.createElement("button");
  physicsButton.textContent = "Toggle Physics Visualization";
  physicsButton.style.padding = "5px";
  physicsButton.style.width = "100%";
  physicsButton.style.cursor = "pointer";

  // Add section divider
  const divider = document.createElement("hr");
  divider.style.marginTop = "10px";
  divider.style.marginBottom = "10px";
  divider.style.border = "0";
  divider.style.borderTop = "1px solid rgba(255, 255, 255, 0.3)";

  container.appendChild(cameraButton);
  container.appendChild(divider);
  container.appendChild(physicsButton);
  document.body.appendChild(container);

  // Event handler for combined physics toggle
  let physicsDebugVisible = false;
  physicsButton.addEventListener("click", () => {
    if (signPhysics) {
      physicsDebugVisible = !physicsDebugVisible;

      // Toggle both debug visualization and bounding box at once
      signPhysics.toggleDebug();
      signPhysics.toggleBoundingBox();

      // Update button text
      physicsButton.textContent = physicsDebugVisible ?
        "Hide Physics Visualization" :
        "Toggle Physics Visualization";
    }
  });

  // Initialize camera toggle if function is provided
  if (initCameraMode) {
    initCameraMode(cameraButton);
  }

  return { container, cameraButton, physicsButton };
}

/**
 * Load all GLTF models
 */
export function loadGLTFModels() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  models.forEach((model) => {
    loader.load(
      model.path,
      (gltf) => {
        const object = gltf.scene;
        object.name = model.name;
        object.position.copy(model.position);
        object.rotation.copy(model.rotation);
        object.scale.copy(model.scale);

        gltf.scene.traverse((node) => {
          if (node.isBone) {
            console.log("Bone found:", node.name); // Log all bone names
          }
        });

        // Apply special materials if needed
        if (model.name === "teapot") {
          object.traverse((node) => {
            if (node.isMesh) {
              applyTeapotMaterial(node);
            }
          });
        }
        else if (model.name === "moon") {
          let meshIndex = 0;
          object.traverse((node) => {
            if (node.isMesh) {
              applyMoonMesh(node, meshIndex++);
            }
          });
        }
        else if (model.name === "capybara") {
          let meshIndex = 0;
          object.traverse((node) => {
            if (node.isMesh) {
              applyCapybaraMaterial(node, meshIndex++);
            }
          });

          // Set up movement parameters
          object.userData.startPosition = object.position.clone();
          object.userData.targetPosition = new THREE.Vector3(-220, 110, 50);
          object.userData.startTime = 15; // Start moving after 15 seconds
          object.userData.duration = 4;
        }

        else if (model.name === "cashier-miffy") {
          const mixer = new THREE.AnimationMixer(object);
          const clip = THREE.AnimationClip.findByName(gltf.animations, 'waving'); // Use actual clip name

          if (clip) {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat); // Set looping here
            action.stop(); // Prevent auto-play

            object.userData.waveAction = action;
            object.userData.waveStarted = false;
            mixers.push(mixer);

            //console.log("Cashier Miffy wave animation initialized");
          } else {
            //console.warn("Wave animation clip not found for Cashier Miffy");
          }
        }
        else if (model.name === "barista-miffy") {
          miffyBarista(object, gltf);
        }
        else if (model.name === "cloud") {
          object.name = "cloud"
          object.traverse((node) => {
            if (node.isMesh && node.material) {
              node.material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0xffffff), // white cloud color
                emissive: new THREE.Color(0xffffff), // emissive color white
                emissiveIntensity: 0.1, // adjust as needed
              });
              node.material.needsUpdate = true;
            }
          });
          cloudAnimation(object, gltf);
        }
        else if (model.name === "oven") {
          ovenOpen(object, gltf);
        }
        else if (model.name === "base") {
          doorOpen(object, gltf);
        }
        else if (model.name === "star") {
          starObject = object;
          starObject.traverse((node) => {
            if (node.isMesh && node.material && "color" in node.material) {
              node.castShadow = false;
              node.receiveShadow = false;
              // Set the color to yellow
              node.material.color.set(0xffff00);
              // Optionally, adjust emissive to enhance the yellow glow:
              node.material.emissive = new THREE.Color(0xffff00);
              node.material.emissiveIntensity = 2;
              node.material.needsUpdate = true;
            }
          });
        }
        else if (model.name === "sign") {
          signObject = object;

          // Create and initialize sign physics
          signPhysics = new SignPhysics(scene);

          // Use a slight delay to ensure the model is properly positioned
          setTimeout(() => {
            signPhysics.init(signObject);
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
