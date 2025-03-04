import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module"; // FOR FPS MONITORING
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import "./style.css";

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

// helper function to load model
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

        if (model.name === "teapot") {
          object.traverse((node) => {
            if (node.isMesh) {
              const mesh = node;

              //apply teapot materials
              applyTeapotMaterial(mesh);
            }
          });
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
];

loadGLTFModels(models);

// FOR FPS MONITORING
const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  stats.update(); // FOR FPS MONITORING
}

FPS = 60;
setTimeout(() => {
  requestAnimationFrame(animate);
  animate();
}, 1000 / FPS);
