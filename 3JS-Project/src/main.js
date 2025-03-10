import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module"; // FOR FPS MONITORING
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import "./styles.css";
import { bspline_interpolate } from "./b-spline.js"
import { cameraToggle } from './index.js';

THREE.Cache.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Light blue sky

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

camera.position.set(0, 200, 1000);
camera.lookAt(0, 500, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setAnimationLoop(animate);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

//global for animating!
let miffyWaveMixer;
let miffyPickupMixer;
let miffyHoldingMixer;
let miffyPutdownMixer;
let cloudMixer;
let ovenOpenMixer;
let ovenCloseMixer;
let doorOpenMixer;


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

function miffyPickup(object, gltf){
  scene.add(object);
  miffyPickupMixer = new THREE.AnimationMixer(object);
  const clips = gltf.animations;
  const pickupClip = THREE.AnimationClip.findByName(clips, 'pickup');

  const action = miffyPickupMixer.clipAction(pickupClip);
  console.log("ANIMATING PICKUP CLIP");
  console.log(pickupClip);
  action.play(); 
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

        if (model.name === "teapot") {
          object.traverse((node) => {
            if (node.isMesh) {
              const mesh = node;

              //apply teapot materials
              applyTeapotMaterial(mesh);
            }
          });
        }
        if (model.name === "moon") {
          let meshIndex = 0;
          object.traverse((node) => {
            if (node.isMesh) {
              const mesh = node;
              applyMoonMesh(mesh);
            }
          });
        }
        if (model.name === "miffy-wave") {
          scene.add(object);
          miffyWaveMixer = new THREE.AnimationMixer(gltf.scene);
          const clips = gltf.animations;
          const waveClip = THREE.AnimationClip.findByName(clips, 'waving');

          const action = miffyWaveMixer.clipAction(waveClip);
          console.log("ANIMATING CLIPS");
          console.log(waveClip);
          action.play(); 
        }
        if (model.name === "miffy-pickup") {
          miffyPickup(object, gltf);
        }
        if (model.name === "miffy-holding") {
          miffyHolding(object, gltf);
        }
        if (model.name === "miffy-putdown") {
          miffyPutdown(object, gltf);
        }
        if (model.name === "cloud") {
          cloudAnimation(object, gltf);
        }
        if (model.name === "oven") {
          ovenOpen(object, gltf);
        }
        if (model.name === "base") {
          doorOpen(object, gltf);
        }

        scene.add(object);
        console.log(`${model.name} GLB loaded successfully`);
      },
      undefined,
      (err) => {
        console.error(`Error loading ${model.name} GLB:`, err);
      }
    );
  });
}

const models = [
  {
    name: "base",
    path: "/assets/new-base/base-transformed.glb",
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
    position: new THREE.Vector3(0, 110, -600),
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
  },
  {
    name: "smallTable",
    path: "/assets/small-table/small-table-transformed-transformed.glb",
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
    path: "/assets/capybara/capy-edited-in-blender-transformed.glb",
    position: new THREE.Vector3(400, 110, 300),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(0.3, 0.3, 0.3),
  },
  {
    name: "miffy-wave",
    path: "/assets/miffy-animation/miffy-wave-fixed-arms-transformed.glb",
    position: new THREE.Vector3(-200, 110, -400),
    rotation: new THREE.Euler(0, Math.PI / 6, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "miffy-pickup",
    path: "/assets/miffy-animation/miffy_pickup_and_putdown-transformed.glb",
    position: new THREE.Vector3(0, 110, -400),
    rotation: new THREE.Euler(0, Math.PI / 6, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "miffy-holding",
    path: "/assets/miffy-animation/miffy_pickup_and_putdown-transformed.glb",
    position: new THREE.Vector3(200, 110, -400),
    rotation: new THREE.Euler(0, Math.PI / 6, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  {
    name: "miffy-putdown",
    path: "/assets/miffy-animation/miffy_pickup_and_putdown-transformed.glb",
    position: new THREE.Vector3(400, 110, -400),
    rotation: new THREE.Euler(0, Math.PI / 6, 0),
    scale: new THREE.Vector3(3, 3, 3),
  },
  // {
  //   name: "star",
  //   path: "/assets/star/star-transformed.glb",
  //   position: new THREE.Vector3(0, 900, -400),
  //   rotation: new THREE.Euler(0, Math.PI / 4, 0),
  //   scale: new THREE.Vector3(1, 1, 1),
  // },
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



// FOR FPS MONITORING
const stats = new Stats();
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  

  if (!cameraToggle) {
    controls.update();
  } else {
    // Camera mode: Move camera along b-spline.
    const duration = 10; // Duration (in seconds) for a full traversal along the spline.
    let t = (elapsedTime % duration) / duration;
    
    // get  new camera pos along the spline.
    const pos = bspline_interpolate(t, degree, controlPoints);
    camera.position.set(pos[0], pos[1], pos[2]);
    
    // compute a look-ahead point so the camera faces forward.
    const lookAheadOffset = 0.1; // Adjust this offset as needed.
    let nextT = ((elapsedTime + lookAheadOffset) % duration) / duration;
    const nextPos = bspline_interpolate(nextT, degree, controlPoints);
    camera.lookAt(new THREE.Vector3(nextPos[0], nextPos[1], nextPos[2]));
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

const FPS = 60;
setTimeout(() => {
  requestAnimationFrame(animate);
  animate();
}, 1000 / FPS);
