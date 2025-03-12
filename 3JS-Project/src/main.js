import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module"; // FOR FPS MONITORING
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import "./styles.css";
import { bspline_interpolate } from "./b-spline.js"
import { cameraToggle } from './index.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'; // Allowed since comes with three.js
import { SignPhysics } from "./physics/SignPhysics.js";

// Global constants and settings
const FPS_LIMIT = 60;
const TIME_STEP = 1 / FPS_LIMIT;

// Physics objects
let signObject = null;
let signPhysics = null;

// Time tracking for physics
let lastPhysicsTime = 0;
let accumulatedTime = 0;

THREE.Cache.enabled = true;
export const scene = new THREE.Scene();
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

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setAnimationLoop(animate);
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// Setup camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

const clock = new THREE.Clock()

//global for animating!
let miffyWaveMixer;
let miffyPickupMixer;
let miffyHoldingMixer;
let miffyPutdownMixer;
let cloudMixer;
let ovenOpenMixer;
let ovenCloseMixer;
let doorOpenMixer;
let starObject = null;

//tray position (for items placed on it)
let trayPosition = new THREE.Vector3(-60, 260, 40);

// lighting
var keyLight = new THREE.DirectionalLight(
  new THREE.Color("hsl(30, 100%, 85%)"),
  2.5
);
keyLight.position.set(-100, 100, 100);
scene.add(keyLight);

var fillLight = new THREE.DirectionalLight(
  new THREE.Color("hsl(240, 100%, 85%)"),
  1.5
);
fillLight.position.set(100, 100, 100);
scene.add(fillLight);

var backLight = new THREE.DirectionalLight(0xffffff, 2.0);
backLight.position.set(100, 100, -100);
scene.add(backLight);

// Key lighting shadows enabled
keyLight.castShadow = true;
fillLight.castShadow = true;
backLight.castShadow = true;

// Increase shadow map size for better quality
keyLight.shadow.mapSize.width = 4096;
keyLight.shadow.mapSize.height = 4096;

// == HDR LIGHTING == (If you disable this, increase tonemapping to 1.2)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

// == Tone Mapping == 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5; // == LOWER THIS TO DECREASE HOW BRIGHT/WHITE EVERYTHING IS

// FOR FPS MONITORING
const stats = new Stats();
document.body.appendChild(stats.dom);

// Create a simple UI with only debug buttons for sign physics
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

function applyMoonMesh(mesh, index) {
  const textureLoader = new THREE.TextureLoader();

  // load textures based on the mesh index
  const colorMap = textureLoader.load(`/assets/moon/model_${index}_color.png`);
  const normalMap = textureLoader.load(`/assets/moon/model_${index}_normal.png`);
  const roughnessMap = textureLoader.load(`/assets/moon/model_${index}_roughness.png`);
  const transmittanceMap = textureLoader.load(`/assets/moon/model_${index}_transmittance.png`);

  // for some reason, the glb refers to it as metallicRoughness despite the womp exporting it as metallic
  const metallicMap = textureLoader.load(`/assets/moon/model_${index}_metallicRoughness.png`);

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


  // Set material properties for translucency and glossiness
  mesh.material.transmission = 1.0; 
  mesh.material.clearcoat = 1.0; 
  mesh.material.clearcoatRoughness = 0.01; 
  mesh.material.ior = 2.5; 

  // Ensure the material updates
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

function miffyPickup(object, gltf) {
  scene.add(object);
  miffyPickupMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');

  if (pickupClip) {
    const action = miffyPickupMixer.clipAction(pickupClip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
    console.log("Barista Miffy is picking up!");

    // Attach tray to Miffy's hand
    setTimeout(() => {
      const handBone = object.getObjectByName("hand_r"); // Adjust based on your model
      if (handBone && trayObject) {
        handBone.add(trayObject);
        trayObject.position.set(0, 10, 0); // Adjust tray position relative to hand
        console.log("Tray attached to Miffy's hand!");
      }
    }, 500); // Delay to match pickup timing
  }
}


function miffyHolding(object, gltf){
  scene.add(object);
  miffyHoldingMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const holdingClip = THREE.AnimationClip.findByName(clips, 'holding');

  const action = miffyHoldingMixer.clipAction(holdingClip);
  console.log("ANIMATING HOLDING CLIP");
  console.log(holdingClip);
  action.play(); 
}

function miffyPutdown(object, gltf){
  scene.add(object);
  miffyPutdownMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const putdownClip = THREE.AnimationClip.findByName(clips, 'putdown');

  const action = miffyPutdownMixer.clipAction(putdownClip);
  console.log("ANIMATING PUTDOWN CLIP");
  console.log(putdownClip);
  action.play(); 
}

function cloudAnimation(object, gltf){
  scene.add(object);
  cloudMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const cloudMovement = THREE.AnimationClip.findByName(clips, 'cloudMovement');

  const action = cloudMixer.clipAction(cloudMovement);
  console.log("ANIMATING CLOUD CLIP");
  console.log(cloudMovement);
  action.play(); 
}

function ovenOpen(object, gltf){
  scene.add(object);
  ovenOpenMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const open = THREE.AnimationClip.findByName(clips, 'open');

  const action = ovenOpenMixer.clipAction(open);
  console.log("ANIMATING OVEN OPENING CLIP");
  console.log(open);
  action.play(); 
}

function doorOpen(object, gltf){
  scene.add(object);
  doorOpenMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const open = THREE.AnimationClip.findByName(clips, 'open');

  const action = doorOpenMixer.clipAction(open);
  console.log("ANIMATING OVEN OPENING CLIP");
  console.log(open);
  action.play(); 
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    const moveSpeed = 40; 

    // get camera curr forward direction
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // comptue left vector as cross product of camera.up and forward
    const left = new THREE.Vector3().crossVectors(camera.up, forward).normalize();

    // move left (add left vector)
    if (event.key.toLowerCase() === "a") {
      camera.position.addScaledVector(left, moveSpeed);
      controls.target.addScaledVector(left, moveSpeed);
    }
    // move right (subtract left vector)
    else if (event.key.toLowerCase() === "d") {
      camera.position.addScaledVector(left, -moveSpeed);
      controls.target.addScaledVector(left, -moveSpeed);
    }
    
    // 'D' to toggle debug visualization (physics)
    if (event.key === "d" || event.key === "D") {
      if (signPhysics) {
        signPhysics.toggleDebug();
      }
    }

    // 'B' to toggle bounding box (physics)
    if (event.key === "b" || event.key === "B") {
      if (signPhysics) {
        signPhysics.toggleBoundingBox();
      }
    }
  });
}

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
              const mesh = node;
              applyMoonMesh(mesh, meshIndex++);
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
        }
        else if (model.name === "cashier-miffy") {
          scene.add(object);
          miffyWaveMixer = new THREE.AnimationMixer(gltf.scene);
          const clips = gltf.animations;
          const waveClip = THREE.AnimationClip.findByName(clips, 'waving');
        
          if (waveClip) {
            const action = miffyWaveMixer.clipAction(waveClip);
            action.setLoop(THREE.LoopRepeat); // Ensure it loops
            action.play();
            console.log("Cashier Miffy is waving!");
          } else {
            console.warn("Waving animation not found for Cashier Miffy");
          }
        }        
        else if (model.name === "barista-miffy") {
          scene.add(object);
          miffyPickupMixer = new THREE.AnimationMixer(object);
          const clips = gltf.animations;
          
          // Find animations
          const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');
          const putdownClip = THREE.AnimationClip.findByName(clips, 'putdown');
        
          if (pickupClip && putdownClip) {
            const pickupAction = miffyPickupMixer.clipAction(pickupClip);
            pickupAction.setLoop(THREE.LoopOnce);
            pickupAction.clampWhenFinished = true;
            pickupAction.play();
            console.log("Barista Miffy is picking up!");
        
          } else {
            console.warn("Pickup or Putdown animation not found for Barista Miffy");
          }
        }        
        else if (model.name === "cloud") {
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
        }
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

// Model definitions
const models = [
  {
    name: "base",
    path: "/assets/new-base/base-fixed-transformed.glb",
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
  },{
    name: "stool-small-table-back-2",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(250, 150, -500),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  },{
    name: "stool-small-table-front-1",
    path: "/assets/stool/stool-transformed.glb",
    position: new THREE.Vector3(250, 150, 550),
    rotation: new THREE.Euler(0, Math.PI / 3, 0),
    scale: new THREE.Vector3(0.8, 0.8, 0.8),
  },{
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
    position: new THREE.Vector3(-500, 110, 600),
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
    position: new THREE.Vector3(-270, 110, -300),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(3, 3, 3),
},
  {
    name: "star",
    path: "/assets/star/star-transformed.glb",
    position: new THREE.Vector3(750, 300, -3150), // start of spline, y-100
    rotation: new THREE.Euler(0, Math.PI / 4, 0),
    scale: new THREE.Vector3(1, 1, 1),
  },
  {
    name: "sign",
    path: "/assets/sign/textured-sign-transformed.glb",
    position: new THREE.Vector3(-400, 550, -880),
    rotation: new THREE.Euler(0, Math.PI/2, 0),
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

// Initialize
setupKeyboardShortcuts();
loadGLTFModels(models);

// Visual-mode for camera path
// NOTE: If you want the b-spline to connect to the end points, duplicate them at beginning and end! :D
const controlPoints = [
  [-500, 500, 250],
  [-500, 500, 250],
  [-250, 500, 0],
  [0, 500, 0],
  [250, 500, 0],
  [500, 250, -250],
  [500, 250, -250]
];

// DRAW SPHERE FOR EACH CONTROL POINT (better visualization)
controlPoints.forEach(point => {
  const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.set(point[0], point[1], point[2]);
  scene.add(sphere); // comment to disable visual
});

const degree = 2; // Degree of the B-spline
const numCurvePoints = 100; // Number of points along the curve
const curvePoints = [];

// sample curve t = [0,1]
for (let i = 0; i <= numCurvePoints; i++) {
  let t = i / numCurvePoints;
  const point = bspline_interpolate(t, degree, controlPoints);
  curvePoints.push(new THREE.Vector3(point[0], point[1], point[2]));
}

const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const curveLine = new THREE.Line(geometry, material);
scene.add(curveLine); // comment to disable visual


// == STAR TWINKLE ANIMATION == //
const starControlPoints = [
  [750, 400, -3150],
  [750, 400, -3150],
  [300, 500, -3500],
  [0, 500, -3750],
  [-200, 600, -4000],
  [-300, 650, -4250],
  [-100, 675, -4400],
  [800, 675, -4250],
  [800, 675, -4250]
];

// DRAW SPHERE FOR EACH CONTROL POINT (better visualization)
starControlPoints.forEach(point => {
  const starSphereGeometry = new THREE.SphereGeometry(10, 16, 16);
  const starSphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
  const starSphere = new THREE.Mesh(starSphereGeometry, starSphereMaterial);
  starSphere.position.set(point[0], point[1], point[2]);
  scene.add(starSphere); // comment to disable visual
});

const starDegree = 2; // Degree of the B-spline
const starNumCurvePoints = 100; // Number of points along the curve
const starCurvePoints = [];

// sample curve t = [0,1]
for (let i = 0; i <= starNumCurvePoints; i++) {
  let t = i / starNumCurvePoints;
  const point = bspline_interpolate(t, starDegree, starControlPoints);
  starCurvePoints.push(new THREE.Vector3(point[0], point[1], point[2]));
}

const starGeometry = new THREE.BufferGeometry().setFromPoints(starCurvePoints);
const starMaterial = new THREE.LineBasicMaterial({ color: 0x0088ff });
const starCurveLine = new THREE.Line(starGeometry, starMaterial);
scene.add(starCurveLine); // comment to disable visual

console.log("Spline and control points added to scene");

// Combined animation function
function animate() {
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
    accumulatedTime -= TIME_STEP;
  }

  if (!cameraToggle) {
    controls.update();
  } else {
    // Camera mode: Move camera along b-spline.
    const duration = 10; // Duration (in seconds) for a full traversal along the spline.
    let t = (elapsedTime % duration) / duration;
    
    // get new camera pos along the spline.
    const pos = bspline_interpolate(t, degree, controlPoints);
    camera.position.set(pos[0], pos[1], pos[2]);
    
    // compute a look-ahead point so the camera faces forward.
    const lookAheadOffset = 0.1; // Adjust this offset as needed.
    let nextT = ((elapsedTime + lookAheadOffset) % duration) / duration;
    const nextPos = bspline_interpolate(nextT, degree, controlPoints);
    camera.lookAt(new THREE.Vector3(nextPos[0], nextPos[1], nextPos[2]));
  }

  if (starObject) {
    const starDuration = 6; // Adjust duration to control star speed
    let starT = (elapsedTime % starDuration) / starDuration;
    const starPos = bspline_interpolate(starT, starDegree, starControlPoints);

    // Move the star with Y offset of -100
    starObject.position.set(starPos[0], starPos[1] - 100, starPos[2]);
  }

  if (miffyWaveMixer) {
    miffyWaveMixer.update(delta);
  }
  if (miffyPickupMixer) {
    miffyPickupMixer.update(delta);
  }
  if (miffyHoldingMixer) {
    miffyHoldingMixer.update(delta);
  }
  if (miffyPutdownMixer) {
    miffyPutdownMixer.update(delta);
  }  
  if (cloudMixer) {
    cloudMixer.update(delta);
  }
  if (ovenOpenMixer) {
    ovenOpenMixer.update(delta);
  }
  if (doorOpenMixer) {
    doorOpenMixer.update(delta);
  }

  renderer.render(scene, camera);
  stats.update(); // FOR FPS MONITORING
}

// Start animation loop
const FPS = 60;
lastPhysicsTime = performance.now();
setTimeout(() => {
  requestAnimationFrame(animate);
  animate();
}, 1000 / FPS);
